import "./env-loader.js";

import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { resolve } from "path";
import { spawn, spawnSync } from "child_process";
import { createRequire } from "module";
import boxen from "boxen";
import chalk from "chalk";

createRequire(import.meta.url); // ensure require is available for dynamic imports
const cwd = process.cwd();
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

// Banner
console.log(
  boxen(
    chalk.bold.green("WhatsApp AI Agent Kit") +
      "\n" +
      chalk.gray("Asistente de configuración (fallback sin Claude Code)"),
    { padding: 1, borderStyle: "round", borderColor: "green" }
  )
);

// ─── FASE A: Validación ───────────────────────────────────────────────────────
console.log(chalk.bold("\n🔍 Fase A — Verificación del sistema\n"));

const nodeVer = process.versions.node;
const [nodeMajor] = nodeVer.split(".").map(Number);
if (nodeMajor < 20) {
  console.log(chalk.red(`❌ Node.js ${nodeVer} — necesitas >= 20. https://nodejs.org`));
  process.exit(1);
}
console.log(chalk.green(`✅ Node.js ${nodeVer}`));
console.log(chalk.green(`✅ Plataforma: ${process.platform}`));

// ─── FASE B: Dependencias ────────────────────────────────────────────────────
console.log(chalk.bold("\n📦 Fase B — Dependencias\n"));

if (!existsSync(resolve(cwd, "node_modules"))) {
  console.log(chalk.yellow("Instalando dependencias..."));
  const result = spawnSync(npmCmd, ["install"], {
    stdio: "inherit",
    shell: false,
    cwd,
  });
  if (result.status !== 0) {
    console.log(chalk.red("❌ npm install falló. Ver errores-sesion.md #13"));
    process.exit(1);
  }
  console.log(chalk.green("✅ Dependencias instaladas"));
} else {
  console.log(chalk.green("✅ node_modules presente"));
}

// ─── FASE C: API Key ─────────────────────────────────────────────────────────
console.log(chalk.bold("\n🔑 Fase C — API Key de OpenRouter\n"));

const envPath = resolve(cwd, ".env.local");
const envExamplePath = resolve(cwd, ".env.example");

if (!existsSync(envPath) && existsSync(envExamplePath)) {
  copyFileSync(envExamplePath, envPath);
  console.log(chalk.gray("  .env.local creado desde .env.example"));
}

let currentKey = process.env.OPENROUTER_API_KEY ?? "";

if (currentKey) {
  console.log(chalk.green(`✅ API key ya configurada (${currentKey.slice(0, 12)}...)`));
} else {
  console.log(chalk.yellow("Necesitas una API key de OpenRouter."));
  console.log(chalk.gray("  1. Ve a https://openrouter.ai/keys"));
  console.log(chalk.gray("  2. Crea una key y cópiala\n"));

  const { default: Enquirer } = await import("enquirer");
  const enquirer = new (Enquirer as unknown as new () => { prompt: <T>(questions: unknown[]) => Promise<T> })();

  const response = await enquirer.prompt<{ apiKey: string }>([
    {
      type: "password",
      name: "apiKey",
      message: "Pega tu API key de OpenRouter (sk-or-v1-...):",
      validate: (v: string) =>
        v.startsWith("sk-or-") ? true : "La key debe empezar por sk-or-",
    },
  ]);

  currentKey = response.apiKey.trim();
  setEnvVar(envPath, "OPENROUTER_API_KEY", currentKey);
  console.log(chalk.green("✅ API key guardada en .env.local"));
}

// ─── FASE D: Arrancar ────────────────────────────────────────────────────────
console.log(chalk.bold("\n🚀 Fase D — Arrancar el agente\n"));
console.log(chalk.yellow("Arrancando bot + dashboard (npm run start:all)..."));
console.log(chalk.gray("  Abre http://localhost:3000 para ver el QR\n"));

spawn(npmCmd, ["run", "start:all"], {
  stdio: "inherit",
  shell: false,
  cwd,
});

function setEnvVar(filePath: string, key: string, value: string): void {
  let content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
  writeFileSync(filePath, content, "utf-8");
}
