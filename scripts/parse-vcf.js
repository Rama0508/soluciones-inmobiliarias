#!/usr/bin/env node
/**
 * Extrae todos los números de teléfono de un archivo VCF (agenda del celular)
 * y los normaliza al formato de WhatsApp para Argentina.
 *
 * Uso: node scripts/parse-vcf.js ruta/al/archivo.vcf
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const vcfPath = process.argv[2];
if (!vcfPath) {
  console.error("Uso: node scripts/parse-vcf.js ruta/al/Contactos.vcf");
  process.exit(1);
}

const outputPath = join(process.cwd(), "config", "contactos-bloqueados.txt");

console.log(`Procesando ${vcfPath}...`);

const content = readFileSync(vcfPath, "utf-8");
const lines = content.split(/\r?\n/);
const phones = new Set();

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("TEL")) continue;

  const match = trimmed.match(/:([+\d\s\-\(\)\.]+)$/);
  if (!match) continue;

  let phone = match[1].trim().replace(/\D/g, "");
  if (!phone || phone.length < 7) continue;

  // Normalización de prefijos locales argentinos con 0 antepuesto (larga distancia)
  // Ej: 038881234567 (12 dígitos) o 01160388170 (11 dígitos) → quitar el 0 inicial
  if (phone.startsWith("0") && !phone.startsWith("00")) {
    phone = phone.slice(1); // quitar el 0 de prefijo de llamada local
  }
  // Prefijo internacional 00XX → quitar doble cero
  if (phone.startsWith("00") && phone.length >= 10) {
    phone = phone.slice(2);
  }

  // Normalización para Argentina
  if (phone.length === 10 && (phone.startsWith("3") || phone.startsWith("11"))) {
    // Local móvil: 3888529249 o 1160388170 → 5493888529249 / 5491160388170
    phone = "549" + phone;
  } else if (phone.length === 12 && phone.startsWith("54") && !phone.startsWith("549")) {
    // Internacional sin el 9 móvil: 543888529249 → 5493888529249
    phone = "549" + phone.slice(2);
  }

  // Descartar números claramente inválidos
  if (phone.length < 8 || phone.length > 15) continue;  // teléfonos reales: 7-15 dígitos (E.164)
  if (/^0{4,}/.test(phone)) continue;                   // demasiados ceros al inicio = basura

  phones.add(phone);
}

const header = `# Contactos personales — el bot NO responde a estos números
# Generado automáticamente desde agenda del teléfono (${new Date().toLocaleDateString("es-AR")})
# Para regenerar: node scripts/parse-vcf.js ruta/Contactos.vcf
# Formato: número sin + ni espacios. Argentina móvil = 549 + número de 10 dígitos
# Ejemplo: +54 9 388 852-9249 → 5493888529249
# Agregar un número tiene efecto inmediato, sin reiniciar el bot.

`;

const sorted = [...phones].sort();
const output = header + sorted.join("\n") + "\n";

writeFileSync(outputPath, output, "utf-8");
console.log(`✓ ${phones.size} números escritos en ${outputPath}`);
