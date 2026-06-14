# Prompts — Cómo personalizar el agente

El agente de IA lee `prompts/negocio.md` en cada conversación para saber cómo comportarse.

---

## Cómo crear o cambiar `negocio.md`

### Opción 1 — Con Claude Code (recomendado)
Ejecuta `/personaliza` en el chat de Claude Code. Te hace 6 preguntas y genera el fichero automáticamente.

### Opción 2 — Manual
Copia `negocio.example.md` a `negocio.md` y edita cada sección.

### Opción 3 — Copiando un ejemplo
Hay 3 ejemplos en `ejemplos/`:
- `agencia-ia.md` — agencia que vende servicios de IA
- `ecommerce.md` — tienda de software/licencias
- `infoproducto.md` — vendedor de curso online

Copia el más parecido a tu negocio a `negocio.md` y ajusta los detalles.

---

## Cómo se inyecta en el system prompt

`src/lib/system-prompt.ts` lee `prompts/negocio.md` en cada llamada a `buildSystemPrompt()`. El contenido del fichero se embebe en el prompt del sistema que recibe el LLM.

**Importante**: cambiar `negocio.md` requiere reiniciar el bot para que lo recoja. Claude Code lo hace automáticamente al ejecutar `/personaliza`.

---

## Formato del fichero

Ver `negocio.example.md` para el formato exacto con las 6 secciones H2 requeridas.
