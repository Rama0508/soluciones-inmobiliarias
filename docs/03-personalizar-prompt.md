# 03 — Personalizar el prompt del agente

## Qué controla el prompt

El fichero `prompts/negocio.md` define cómo se comporta el agente:
- Cómo se presenta
- Qué preguntas hace para calificar leads
- Cuándo deriva a humano o agenda llamada
- El tono y el estilo de comunicación

## Crear el prompt con Claude Code

Ejecuta `/personaliza` en el chat. Claude te hará 6 preguntas (una a la vez) y generará el fichero.

## Editar manualmente

Edita `prompts/negocio.md` directamente. El formato tiene 6 secciones H2:
1. `## Nombre`
2. `## A qué se dedica`
3. `## Propuesta de valor`
4. `## Preguntas de calificación al lead`
5. `## Criterios de lead bueno vs malo`
6. `## Acción cuando el lead encaja`

## Cómo se inyecta en el LLM

`src/lib/system-prompt.ts` lee `negocio.md` en cada llamada. El contenido se añade al system prompt que recibe el modelo de IA.

## Aplicar cambios

Después de editar `negocio.md` necesitas reiniciar el bot:
- Con Claude Code: `/personaliza` lo hace automáticamente
- Manual: crea el fichero `data/.restart` (el bot lo detecta en 1s)
- O reinicia `npm run start:all`

## Ejemplo de prompt completo

Ver `prompts/negocio.example.md` y los ejemplos en `prompts/ejemplos/`.
