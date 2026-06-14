import { statfsSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

const cwd = process.cwd();
let failures = 0;

function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
}

function fail(msg: string) {
  console.log(`  ❌ ${msg}`);
  failures++;
}

function warn(msg: string) {
  console.log(`  ⚠️  ${msg}`);
}

console.log("\n🔍 WhatsApp AI Agent Kit — Verificación del sistema\n");

// 1. Node version >= 20
const nodeVer = process.versions.node;
const [nodeMajor] = nodeVer.split(".").map(Number);
if (nodeMajor >= 20) {
  ok(`Node.js ${nodeVer} (>= 20 requerido)`);
} else {
  fail(`Node.js ${nodeVer} — Se necesita >= 20. Actualiza en https://nodejs.org`);
}

// 2. Plataforma soportada
const platform = process.platform;
if (platform === "win32" || platform === "darwin" || platform === "linux") {
  ok(`Sistema operativo: ${platform}`);
} else {
  warn(`Plataforma no verificada: ${platform}. Puede funcionar, pero no está testada.`);
}

// 3. npm presente
try {
  const npmVer = execSync("npm --version", { encoding: "utf-8" }).trim();
  ok(`npm ${npmVer}`);
} catch {
  fail("npm no encontrado. Instala Node.js desde https://nodejs.org");
}

// 4. Espacio en disco >= 500MB
try {
  const stat = statfsSync(cwd);
  const freeMB = (stat.bavail * stat.bsize) / (1024 * 1024);
  if (freeMB >= 500) {
    ok(`Espacio libre: ${Math.round(freeMB)} MB (>= 500 MB requerido)`);
  } else {
    fail(
      `Espacio libre insuficiente: ${Math.round(freeMB)} MB. Se necesitan al menos 500 MB.`
    );
  }
} catch {
  warn("No se pudo verificar el espacio en disco.");
}

// 5. Estructura del kit
const requiredFiles = [
  "package.json",
  "src/lib/db.ts",
  "scripts/start-bot.ts",
];
const missingFiles = requiredFiles.filter(
  (f) => !existsSync(resolve(cwd, f))
);
if (missingFiles.length === 0) {
  ok("Estructura del kit OK");
} else {
  fail(`Faltan ficheros del kit: ${missingFiles.join(", ")}`);
}

// 6. .env.local
if (existsSync(resolve(cwd, ".env.local"))) {
  ok(".env.local existe");
} else {
  warn(
    ".env.local no encontrado. Copia .env.example a .env.local y rellénalo, o ejecuta /setup"
  );
}

// 7. node_modules
if (existsSync(resolve(cwd, "node_modules"))) {
  ok("node_modules instalado");
} else {
  fail('node_modules no encontrado. Ejecuta "npm install" o /setup');
}

// Resultado
console.log("");
if (failures === 0) {
  console.log("✨ Todo en orden. El sistema está listo.\n");
  process.exit(0);
} else {
  console.log(
    `🚨 ${failures} problema(s) encontrado(s). Resuélvelos antes de continuar.\n`
  );
  process.exit(1);
}
