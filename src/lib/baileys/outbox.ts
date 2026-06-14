import type { WASocket } from "@whiskeysockets/baileys";
import { getPendingOutbox, markOutboxSent, getConversationById } from "../db.js";
import pino from "pino";

const logger = pino({ level: (process.env.LOG_LEVEL ?? "info") as pino.Level });

let outboxTimer: ReturnType<typeof setInterval> | null = null;

export function startOutboxLoop(sock: WASocket): void {
  if (outboxTimer) return;

  outboxTimer = setInterval(async () => {
    const pending = getPendingOutbox(20);
    for (const item of pending) {
      try {
        const convo = getConversationById(item.conversation_id);
        // Usar convo.jid para soportar @lid — nunca hardcodear @s.whatsapp.net
        const jid = convo?.jid ?? `${item.phone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: item.content });
        markOutboxSent(item.id);
        logger.debug({ jid, id: item.id }, "Outbox: mensaje enviado");
      } catch (e) {
        // No marcar como enviado — reintentará en el siguiente tick (2s)
        logger.warn({ err: e, id: item.id }, "Outbox: error enviando — reintentará");
      }
    }
  }, 2000);
}

export function stopOutboxLoop(): void {
  if (outboxTimer) {
    clearInterval(outboxTimer);
    outboxTimer = null;
  }
}
