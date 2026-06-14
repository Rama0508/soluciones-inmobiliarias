---
description: Primera instalación del WhatsApp AI Agent Kit. Instala dependencias, configura la API key de OpenRouter y conecta WhatsApp por QR.
---

# /setup — Primera instalación

Ejecuta las fases en orden. **No saltar fases.** Valida tras cada acción crítica antes de continuar.

---

## Fase A — Validación silenciosa del sistema

Ejecuta `npm run check` y analiza la salida. Si algún check crítico falla:
- Node < 20: informa al usuario y detente — no se puede continuar.
- Sin npm: informa y detente.
- Sin espacio (<500MB): advierte pero continúa.
- Sin `.env.local` o `node_modules`: normal en primera instalación, continúa.

Detecta el SO con `process.platform` para adaptar comandos (Windows: `npm.cmd`).

## Fase A.5 — Saludo

- Si NO existe `data/messages.db` ni `auth/`: *"Es tu primera vez. Vamos a montarlo todo."*
- Si ya existen: *"Parece que ya tienes una instalación. ¿Quieres reinstalar o solo actualizar la configuración?"*

---

## Fase B — Instalación de dependencias

1. Ejecuta `npm install`.
2. Si falla con `ERR_INVALID_ARG_TYPE`, `reify` o `rollback`:
   - **Causa**: `node_modules` corrupto (no es problema de dependencias).
   - **Solución**: borrar `node_modules/` y ejecutar `npm install` de nuevo. Ver `errores-sesion.md #13`.
3. Tras instalar: ejecuta `npm run typecheck` y verifica exit 0.
4. En Windows + error de `better-sqlite3`:
   - Necesita Visual Studio Build Tools.
   - Ejecuta: `npm rebuild better-sqlite3`.
5. Ejecuta `npm run build` (obligatorio: `start:all` usa `next start` en modo producción, no `next dev`).

---

## Fase C — Configurar API key de OpenRouter

1. Pregunta: *"¿Tienes cuenta en OpenRouter? (openrouter.ai)"*
   - Si no: explica que es donde está el acceso a los modelos de IA y dale el link.
2. Pide la API key (formato `sk-or-v1-...`).
3. Crea o edita `.env.local` preservando otras variables existentes.
4. **VALIDA la key** llamando a `validateApiKey()` desde `src/lib/openrouter.ts` antes de confirmar.
   - Si responde 401: *"La key es inválida. ¿Puedes comprobarla en openrouter.ai/keys?"*
   - Si OK: confirma y continúa.
5. Pregunta si quieren cambiar el modelo (por defecto `openai/gpt-4o-mini`).
   - Recuerda: **nunca modelos `:free`**.

---

## Fase D — Conectar WhatsApp

1. Lanza `npm run start:all` en background.
2. Abre `http://localhost:3000` para mostrar el QR al usuario.
3. Polling de `connection_state` en la DB (id=1) cada 3s, máximo 2 minutos:
   - `status='qr'`: *"El QR ya aparece en el panel. Escanéalo con WhatsApp → Dispositivos vinculados."*
   - `status='connected'`: ✅ conectado.
   - Timeout 2 min sin conectar: sugerir `npm run start:bot` + `npm run dev` por separado.
4. Si el bot arranca pero no aparece el QR: verificar en DB `SELECT * FROM connection_state WHERE id=1`.

**Nota importante**: los mensajes de prueba deben enviarse desde **OTRO móvil**, no desde el número vinculado — los mensajes propios se ignoran por diseño.

**Nota WhatsApp 2025+**: el sistema acepta JIDs `@lid` además de `@s.whatsapp.net` — no te sorprendas si el jid tiene formato diferente.

---

## Fase E — Prueba de funcionamiento

1. Instruye: *"Escribe 'hola' desde otro móvil al número conectado."*
2. Verifica en el panel que aparece la conversación y el agente responde.
3. Si no responde:
   - Ejecuta `npm run doctor`.
   - Revisa `errores-sesion.md`.
   - Verifica que `mode='AI'` en la conversación.

---

## Al terminar

Confirma que todo está operativo y sugiere el siguiente paso: `/personaliza` para entrenar el agente con los datos del negocio.
