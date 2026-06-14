import "./env-loader.js";

import { existsSync, readdirSync } from "fs";
import { execSync } from "child_process";
import { resolve, join } from "path";
import { createRequire } from "module";
import chalk from "chalk";

const require = createRequire(import.meta.url);
const cwd = process.cwd();

console.log(chalk.bold("\n🩺 WhatsApp AI Agent Kit — Diagnóstico\n"));

// ─── BLOQUE 1: Variables de entorno ───────────────────────────────────────────
console.log(chalk.bold.underline("1. Variables de entorno"));

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey || !apiKey.trim()) {
  console.log(chalk.red("  ❌ OPENROUTER_API_KEY no encontrada o vacía."));
  console.log(chalk.gray("     Edita .env.local o ejecuta /setup"));
} else if (!apiKey.startsWith("sk-or-v1-")) {
  console.log(
    chalk.yellow(
      "  ⚠️  OPENROUTER_API_KEY no tiene el formato esperado (sk-or-v1-...)."
    )
  );
} else {
  console.log(chalk.green("  ✅ OPENROUTER_API_KEY presente y con formato correcto"));
}

const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
if (model.includes(":free")) {
  console.log(
    chalk.red(
      `  ❌ OPENROUTER_MODEL="${model}" usa un modelo :free — saturados, dan 429 en producción.`
    )
  );
  console.log(chalk.gray("     Cámbialo a openai/gpt-4o-mini o similar (sin :free)"));
} else {
  console.log(chalk.green(`  ✅ OPENROUTER_MODEL="${model}"`));
}

// ─── BLOQUE 2: node_modules + TypeScript ──────────────────────────────────────
console.log(chalk.bold.underline("\n2. Dependencias y TypeScript"));

if (!existsSync(resolve(cwd, "node_modules"))) {
  console.log(chalk.red('  ❌ node_modules no encontrado. Ejecuta "npm install"'));
} else {
  console.log(chalk.green("  ✅ node_modules presente"));
  try {
    execSync("npx tsc --noEmit", { stdio: "pipe", cwd });
    console.log(chalk.green("  ✅ TypeScript sin errores"));
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    console.log(chalk.red("  ❌ TypeScript tiene errores:"));
    const output = err.stdout?.toString() ?? err.stderr?.toString() ?? "";
    output
      .split("\n")
      .slice(0, 10)
      .forEach((l) => console.log(chalk.gray("     " + l)));
  }
}

// ─── BLOQUE 3: Estado de conexión WhatsApp ────────────────────────────────────
console.log(chalk.bold.underline("\n3. Estado de conexión WhatsApp"));

const dbPath = join(cwd, "data", "messages.db");
if (!existsSync(dbPath)) {
  console.log(chalk.yellow("  ⚠️  Base de datos no encontrada — el bot aún no ha arrancado."));
} else {
  try {
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    const db = new Database(dbPath, { readonly: true });
    const row = db
      .prepare(
        "SELECT status, phone, qr_string FROM connection_state WHERE id = 1"
      )
      .get() as { status: string; phone: string | null; qr_string: string | null } | undefined;
    db.close();

    if (!row) {
      console.log(chalk.yellow("  ⚠️  No hay estado de conexión en la DB."));
    } else {
      const statusMap: Record<string, string> = {
        connected: chalk.green(`  ✅ Conectado — teléfono: ${row.phone ?? "?"}`),
        qr: chalk.yellow("  ⚠️  Esperando escanear QR — abre http://localhost:3000"),
        connecting: chalk.yellow("  ⚠️  Conectando... espera unos segundos"),
        disconnected: chalk.red("  ❌ Desconectado — ejecuta npm run start:all"),
      };
      console.log(statusMap[row.status] ?? chalk.gray(`  ? Estado: ${row.status}`));
    }
  } catch (e) {
    console.log(chalk.red("  ❌ Error al leer la DB: " + String(e)));
  }
}

// ─── BLOQUE 4: Ficheros clave ─────────────────────────────────────────────────
console.log(chalk.bold.underline("\n4. Ficheros clave"));

if (existsSync(resolve(cwd, "auth"))) {
  const authFiles = readdirSync(resolve(cwd, "auth"));
  if (authFiles.length > 0) {
    console.log(chalk.green(`  ✅ Sesión WhatsApp en auth/ (${authFiles.length} fichero(s))`));
  } else {
    console.log(chalk.yellow("  ⚠️  auth/ existe pero está vacío — pendiente de escanear QR"));
  }
} else {
  console.log(chalk.yellow("  ⚠️  auth/ no existe — el bot lo creará al arrancar"));
}

const negocioPath = resolve(cwd, "prompts", "negocio.md");
if (existsSync(negocioPath)) {
  console.log(chalk.green("  ✅ prompts/negocio.md configurado"));
} else {
  console.log(
    chalk.yellow(
      "  ⚠️  prompts/negocio.md no existe — el agente usará el prompt genérico hasta que ejecutes /personaliza"
    )
  );
}

// ─── BLOQUE 5: Procesos zombie (Windows) ─────────────────────────────────────
if (process.platform === "win32") {
  console.log(chalk.bold.underline("\n5. Procesos node.exe (Windows)"));
  try {
    const output = execSync(
      'tasklist /fi "imagename eq node.exe" /fo csv /nh',
      { encoding: "utf-8", stdio: "pipe" }
    );
    const nodeProcs = output.split("\n").filter((l) => l.includes("node.exe"));
    if (nodeProcs.length > 3) {
      console.log(
        chalk.yellow(
          `  ⚠️  ${nodeProcs.length} procesos node.exe activos — puede haber procesos zombie.`
        )
      );
      console.log(chalk.gray("     Abre Task Manager y termina los node.exe sobrantes."));
    } else {
      console.log(chalk.green(`  ✅ ${nodeProcs.length} proceso(s) node.exe (normal)`));
    }
  } catch {
    console.log(chalk.gray("  — No se pudo verificar procesos (tasklist no disponible)"));
  }
} else {
  console.log(chalk.bold.underline("\n5. Procesos (Unix)"));
  console.log(chalk.gray("  — Verificación de zombie sólo en Windows"));
}

console.log("\n" + chalk.bold("Diagnóstico completo.\n"));
