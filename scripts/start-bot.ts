import "./env-loader.js"; // PRIMER import, side-effect — carga .env.local antes que todo

import pino from "pino";
import { start, watchRestartFlag } from "../src/lib/baileys/client.js";

const logger = pino({
  level: (process.env.LOG_LEVEL ?? "info") as pino.Level,
});

if (!process.env.OPENROUTER_API_KEY?.trim()) {
  logger.error(
    "Falta OPENROUTER_API_KEY. Edita .env.local o ejecuta /setup en Claude Code."
  );
  process.exit(1);
}

process.on("SIGINT", () => {
  logger.info("Bot detenido (SIGINT)");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Bot detenido (SIGTERM)");
  process.exit(0);
});

logger.info("Iniciando bot de WhatsApp...");

await start();
watchRestartFlag();
