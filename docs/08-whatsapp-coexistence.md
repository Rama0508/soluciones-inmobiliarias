# 08 — Coexistencia con WhatsApp

---

## Una sesión por número

Baileys funciona como WhatsApp Web: un número solo puede tener una sesión activa a la vez en el kit. Si abres WhatsApp Web en el navegador con el mismo número, la sesión del kit se cerrará (código 440).

**Recomendación**: usa un número dedicado para el agente, diferente al tuyo personal.

---

## Mensajes propios ignorados

El handler ignora mensajes con `msg.key.fromMe = true`. Esto es intencional — el agente no debe responderse a sí mismo.

**Para probar el agente**: envía mensajes desde **otro móvil** al número vinculado.

---

## Grupos y broadcasts

El handler ignora automáticamente:
- Grupos (`@g.us`)
- Broadcasts (`@broadcast`)
- Newsletters (`@newsletter`)

El agente solo atiende mensajes 1:1.

---

## Formatos de JID soportados

El kit acepta ambos formatos que WhatsApp puede usar:
- `34600000000@s.whatsapp.net` — formato clásico
- `<hash>@lid` — formato nuevo (WhatsApp 2025+)

Siempre guarda el JID completo en `conversations.jid` para usar el formato correcto al responder (especialmente importante para `@lid`).

---

## Tipos de mensaje soportados

El agente solo procesa **texto plano**:
- `message.conversation`
- `message.extendedTextMessage.text`

Ignora silenciosamente: audio, imágenes, stickers, documentos, reacciones, etc. Si un lead envía un audio, el agente no responde (diseño intencional — no transcribimos audio en esta versión).

---

## Límites y buenas prácticas

- No uses el kit para envíos masivos (spam) — WhatsApp puede bloquear el número
- El agente responde a conversaciones entrantes, no las inicia
- Si detectas patrones de uso sospechoso, WhatsApp puede requerir un nuevo QR o bloquear el número temporalmente
