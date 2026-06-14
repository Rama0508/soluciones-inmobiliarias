# Errores de sesión — WhatsApp AI Agent Kit

Registro de errores conocidos y sus soluciones. Consultar SIEMPRE antes de improvisar.

---

## #1 — Código 401 (loggedOut): sesión inválida

**Síntoma**: El bot se desconecta con code 401 y no reconecta.
**Causa**: WhatsApp invalidó la sesión (usuario desvinculó el dispositivo, o la sesión caducó).
**Solución**: Desconectar desde el panel (`/api/connection/disconnect`) o borrar `auth/` manualmente y reiniciar para obtener nuevo QR.
**No hacer**: Intentar reconectar sin borrar `auth/` — entrará en bucle.

---

## #2 — Código 405: versión desactualizada

**Síntoma**: El bot se desconecta inmediatamente con code 405.
**Causa**: WhatsApp rechazó la versión de cliente (versión antigua hardcodeada).
**Solución**: `fetchLatestBaileysVersion()` en `client.ts` obtiene la versión actual en cada arranque. Si aun así falla, actualiza `@whiskeysockets/baileys` con `npm update`.

---

## #3 — Código 440 (connectionReplaced): loop de reconexión

**Síntoma**: El bot reconecta en loop, código 440 repetido en logs.
**Causa**: Fingerprint de browser no reconocido o sesión reemplazada por otra instancia.
**Solución**: Usar `Browsers.macOS('Desktop')` (ya configurado en `client.ts`). El backoff de 15s evita el loop. Si persiste: borrar `auth/` y reiniciar.
**No hacer**: Cambiar el `browser` a uno custom — dispara el 440 en loop.

---

## #4 — Código 515: confundido con error

**Síntoma**: El log muestra código 515 al conectar.
**Causa**: 515 NO es un error. Es la señal de que el pairing fue exitoso.
**Solución**: Ignorarlo. El evento `connection.update` con `connection='open'` confirma la conexión.

---

## #5 — Mensajes propios no aparecen / bot responde a sí mismo

**Síntoma**: El bot no procesa mensajes o los procesa dos veces.
**Causa**: Se está probando desde el mismo número vinculado.
**Solución**: Probar SIEMPRE desde OTRO móvil. Los mensajes con `msg.key.fromMe = true` se ignoran por diseño.

---

## #6 — Mensajes de grupos o broadcasts procesados

**Síntoma**: El bot responde en grupos o a broadcasts.
**Causa**: El filtro de JIDs no está activo o fue modificado.
**Solución**: Verificar en `handler.ts` que se filtran `@g.us`, `@broadcast` y `@newsletter`.

---

## #7 — Mensajes perdidos en WhatsApp 2025+ (LID)

**Síntoma**: El bot no recibe mensajes de algunos usuarios.
**Causa**: WhatsApp despliega JIDs con formato `@lid` en lugar de `@s.whatsapp.net` en ciertas versiones.
**Solución**: El handler acepta ambos formatos. Verificar que `handler.ts` incluye la comprobación de `remoteJid.endsWith('@lid')`.

---

## #8 — SQLITE_BUSY durante `npm run build`

**Síntoma**: El build de Next.js falla con `SQLITE_BUSY` o `database is locked`.
**Causa**: `next build` lanza ~10 workers paralelos que importan las rutas API; si `db.ts` abre la DB al importarse, múltiples workers compiten.
**Solución**: La inicialización de la DB es PEREZOSA en `db.ts` — solo se abre en la primera llamada real a una función. No modificar este patrón.

---

## #9 — `better-sqlite3` falla al compilar en Windows

**Síntoma**: `npm install` falla con error de `node-gyp` o `MSBUILD`.
**Causa**: `better-sqlite3` requiere compilación nativa con Visual Studio Build Tools.
**Solución**:
1. Instalar Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Seleccionar "Desktop development with C++"
3. Ejecutar: `npm rebuild better-sqlite3`

---

## #10 — El panel no muestra el QR aunque el bot arrancó

**Síntoma**: El bot arranca, muestra QR en terminal, pero `http://localhost:3000` no lo muestra.
**Causa**: Race condition — el estado en DB puede estar en `connecting` cuando el QR ya existe.
**Solución**: El endpoint `/api/connection/status` muestra el QR si `qr_string` existe Y status es `qr` O `connecting`. Esta condición no debe modificarse.

---

## #11 — El agente no responde aunque está conectado

**Síntoma**: Mensajes llegan al panel pero el bot no responde.
**Causas posibles**:
1. La conversación está en modo `HUMAN` — verificar en el panel.
2. Falta `OPENROUTER_API_KEY` o es inválida — ejecutar `npm run doctor`.
3. El modelo `:free` está saturado (error 429) — cambiar a `openai/gpt-4o-mini`.
4. El bot no está corriendo — verificar procesos activos.

---

## #12 — Mensajes del dashboard no llegan a WhatsApp

**Síntoma**: Los mensajes enviados desde el panel aparecen en el panel pero no en WhatsApp.
**Causa**: El loop de outbox no está activo (el bot no está conectado o se detuvo).
**Solución**: Verificar que `npm run start:all` sigue corriendo. El outbox se procesa cuando `connection='open'` y `startOutboxLoop()` se llamó.

---

## #13 — `npm install` falla con ERR_INVALID_ARG_TYPE o reify/rollback

**Síntoma**: Instalación falla con errores de tipos internos de npm, no de dependencias.
**Causa**: `node_modules` corrupto (permisos, instalación interrumpida, caché dañada).
**Solución**:
```
rm -rf node_modules
npm cache clean --force
npm install
```
En Windows (PowerShell): `Remove-Item -Recurse -Force node_modules`

---

## #14 — Proceso zombie de node.exe en Windows

**Síntoma**: `npm run start:all` dice "puerto en uso" al relanzar.
**Causa**: El proceso anterior no terminó correctamente (Ctrl+C en Windows no siempre mata hijos).
**Solución**: Task Manager → terminar todos los procesos `node.exe`. O desde PowerShell: `taskkill /F /IM node.exe`

---

## #15 — Error de TypeScript en rutas API de Next.js 16

**Síntoma**: `tsc --noEmit` falla con error en params de rutas dinámicas.
**Causa**: Next.js 16 cambió la firma de contexto de rutas — `params` es ahora una `Promise`.
**Solución**: Usar la firma correcta:
```ts
interface RouteContext { params: Promise<{ conversationId: string }> }
const { conversationId } = await ctx.params;
```
