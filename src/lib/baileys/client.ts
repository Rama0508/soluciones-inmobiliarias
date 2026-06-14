import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason,
  type WASocket,
} from "@whiskeysockets/baileys";
import { type Boom } from "@hapi/boom";
import pino from "pino";
import qrcodeTerminal from "qrcode-terminal";
import { mkdirSync, existsSync, rmSync, writeFileSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import { setConnectionState, getConnectionState } from "../db.js";
import { handleIncomingMessages } from "./handler.js";
import { startOutboxLoop, stopOutboxLoop } from "./outbox.js";

// Códigos de desconexión relevantes:
// 401 = loggedOut       → no reconectar, pedir nuevo QR
// 405 = versión vieja   → mitigado con fetchLatestBaileysVersion
// 440 = connectionReplaced / fingerprint → backoff 15s para no entrar en loop
// 515 = señal de pairing OK → ignorar, NO es error

const AUTH_DIR = resolve(process.cwd(), "auth");
const DATA_DIR = resolve(process.cwd(), "data");
const RESTART_FLAG = join(DATA_DIR, ".restart");

const logger = pino({ level: (process.env.LOG_LEVEL ?? "info") as pino.Level });

interface Handle {
  sock: WASocket;
  shutdown: () => void;
}

let handle: Handle | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export async function start(): Promise<void> {
  mkdirSync(AUTH_DIR, { recursive: true });
  mkdirSync(DATA_DIR, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  // SIEMPRE intentar obtener la versión — WhatsApp rechaza versiones viejas con code 405
  let version: [number, number, number] | undefined;
  try {
    const result = await fetchLatestBaileysVersion();
    version = result.version;
  } catch {
    logger.warn("No se pudo obtener versión de WhatsApp Web — usando default");
    version = undefined;
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }), // Baileys siempre silent
    browser: Browsers.macOS("Desktop"), // fingerprint conocido; uno custom dispara code 440 en loop
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  function shutdown() {
    try {
      sock.end(undefined);
    } catch {
      // ignorar errores al cerrar
    }
  }

  handle = { sock, shutdown };

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      setConnectionState({ status: "qr", qr_string: qr, phone: null });
      qrcodeTerminal.generate(qr, { small: true });
      logger.info("QR generado — escanéalo desde WhatsApp > Dispositivos vinculados");
    }

    if (connection === "connecting") {
      const current = getConnectionState();
      // Solo degradar a 'connecting' si estábamos en 'disconnected'
      // No pisar 'qr' (mantiene qr_string) ni 'connected'
      if (current.status === "disconnected") {
        setConnectionState({ status: "connecting" });
      }
    }

    if (connection === "open") {
      const userId = sock.user?.id ?? "";
      const phone = userId.split(":")[0].split("@")[0];
      setConnectionState({ status: "connected", qr_string: null, phone });
      startOutboxLoop(sock);
      logger.info(`✅ WhatsApp conectado — ${phone}`);
    }

    if (connection === "close") {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      stopOutboxLoop();

      if (code === DisconnectReason.loggedOut) {
        // 401: sesión inválida — no reconectar automáticamente
        logger.warn("Sesión cerrada (loggedOut 401). Desconecta desde el panel y escanea el QR de nuevo.");
        setConnectionState({ status: "disconnected", qr_string: null, phone: null });
      } else {
        // No tocar la DB — mantener estado 'connected' mientras reconecta
        scheduleReconnect(code);
      }
    }
  });

  sock.ev.on("messages.upsert", (event) => {
    handleIncomingMessages(sock, event).catch((e) =>
      logger.error({ err: e }, "Error en handleIncomingMessages")
    );
  });
}

function scheduleReconnect(code: number | undefined): void {
  if (reconnectTimer) return;

  // code 440 = connectionReplaced: backoff largo para no entrar en loop
  const delay = code === 440 ? 15000 : 5000;
  logger.info(`Reconectando en ${delay / 1000}s (código ${code ?? "?"})...`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    handle?.shutdown();
    await start();
  }, delay);
}

export function watchRestartFlag(): void {
  setInterval(async () => {
    if (existsSync(RESTART_FLAG)) {
      try {
        unlinkSync(RESTART_FLAG);
      } catch {
        // race condition — otro proceso ya lo borró
      }
      logger.info("Flag de restart detectado — reiniciando sesión WhatsApp...");
      stopOutboxLoop();
      handle?.shutdown();
      rmSync(AUTH_DIR, { recursive: true, force: true });
      await start();
    }
  }, 1000);
}
