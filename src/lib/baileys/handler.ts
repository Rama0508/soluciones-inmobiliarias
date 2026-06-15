import type { WASocket, BaileysEventMap } from "@whiskeysockets/baileys";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  getOrCreateConversation,
  insertMessage,
  getConversationById,
  getRecentHistory,
} from "../db.js";
import { generateReply, transcribeAudio } from "../openrouter.js";
import pino from "pino";

function getBlockedPhones(): Set<string> {
  const filePath = join(process.cwd(), "config", "contactos-bloqueados.txt");
  if (!existsSync(filePath)) return new Set();
  try {
    const lines = readFileSync(filePath, "utf-8").split("\n");
    const phones = lines
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith("#"))
      .map(l => l.replace(/\D/g, ""));
    return new Set(phones);
  } catch {
    return new Set();
  }
}

const logger = pino({ level: (process.env.LOG_LEVEL ?? "info") as pino.Level });

export async function handleIncomingMessages(
  sock: WASocket,
  event: BaileysEventMap["messages.upsert"]
): Promise<void> {
  // 'append' y 'replace' son mensajes históricos — ignorar
  if (event.type !== "notify") return;

  for (const msg of event.messages) {
    // Mensajes propios — siempre probar desde OTRO móvil
    if (msg.key.fromMe) continue;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) continue;

    // Ignorar grupos, broadcasts y newsletters
    if (
      remoteJid.endsWith("@g.us") ||
      remoteJid.endsWith("@broadcast") ||
      remoteJid.endsWith("@newsletter")
    ) {
      continue;
    }

    // @lid = contacto agendado en el teléfono → ignorar siempre
    // @s.whatsapp.net = contacto nuevo/desconocido → procesar
    if (remoteJid.endsWith("@lid")) continue;
    if (!remoteJid.endsWith("@s.whatsapp.net")) continue;

    // Texto plano, imagen (con caption) o audio
    const imageMessage = msg.message?.imageMessage ?? null;
    const audioMessage = msg.message?.audioMessage ?? null;
    let text =
      msg.message?.conversation ??
      msg.message?.extendedTextMessage?.text ??
      imageMessage?.caption ??
      null;

    // Transcribir audio si lo hay
    if (audioMessage && !text) {
      try {
        const buffer = await downloadMediaMessage(
          msg,
          "buffer",
          {},
          { logger, reuploadRequest: sock.updateMediaMessage }
        ) as Buffer;
        const mimeType = audioMessage.mimetype ?? "audio/ogg; codecs=opus";
        const transcript = await transcribeAudio(buffer, mimeType);
        if (transcript) text = transcript;
      } catch (e) {
        logger.warn({ err: e }, "No se pudo transcribir el audio");
      }
    }

    if (!text && !imageMessage) continue;

    // Descargar imagen si la hay
    let imageData: { base64: string; mimeType: string } | undefined;
    if (imageMessage) {
      try {
        const buffer = await downloadMediaMessage(
          msg,
          "buffer",
          {},
          { logger, reuploadRequest: sock.updateMediaMessage }
        ) as Buffer;
        imageData = {
          base64: buffer.toString("base64"),
          mimeType: imageMessage.mimetype ?? "image/jpeg",
        };
      } catch (e) {
        logger.warn({ err: e }, "No se pudo descargar la imagen — procesando solo texto");
      }
    }

    const phone = remoteJid.split("@")[0].split(":")[0];

    // Ignorar contactos personales bloqueados
    if (getBlockedPhones().has(phone)) {
      logger.debug({ phone }, "Número en lista de bloqueados — ignorando mensaje");
      continue;
    }

    const storedText = text ?? "[Imagen recibida]";
    const name = msg.pushName ?? undefined;

    const convo = getOrCreateConversation(phone, name, remoteJid);
    insertMessage(convo.id, "user", storedText);

    // Re-leer la conversación — el modo pudo cambiar mientras procesábamos
    const fresh = getConversationById(convo.id);
    if (!fresh) continue;

    if (fresh.mode !== "AI") {
      logger.debug({ phone }, "Mensaje recibido en modo HUMAN — sin respuesta automática");
      continue;
    }

    logger.debug({ phone }, "Generando respuesta IA...");
    try {
      const history = getRecentHistory(convo.id, 20);
      const reply = await generateReply({ history, conversationId: convo.id, imageData });

      if (!reply) continue;

      insertMessage(convo.id, "assistant", reply);
      await sock.sendMessage(remoteJid, { text: reply });
      logger.debug({ phone }, "Respuesta enviada");
    } catch (e) {
      logger.error({ err: e, phone }, "Error generando o enviando respuesta IA");
    }
  }
}
