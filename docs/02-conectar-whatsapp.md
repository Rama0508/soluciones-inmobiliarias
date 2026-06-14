# 02 — Conectar WhatsApp

## Cómo funciona

El kit usa Baileys, una librería que simula WhatsApp Web. No requiere API oficial de Meta ni número de empresa.

**Limitaciones**:
- Un número = una sesión (como WhatsApp Web normal)
- No apto para envíos masivos (viola los términos de WhatsApp)
- Si WhatsApp detecta uso anómalo puede bloquear el número

## Conectar por QR

1. Arranca el kit: `npm run start:all`
2. Abre `http://localhost:3000`
3. Escanea el QR desde WhatsApp → Dispositivos vinculados → Vincular un dispositivo

La sesión queda guardada en `auth/`. En el siguiente arranque no necesitas reescanear.

## Probar el agente

Envía un mensaje desde **otro móvil** al número vinculado. Los mensajes del propio número vinculado se ignoran (limitación de WhatsApp Web).

## WhatsApp 2025+ y JIDs tipo @lid

En versiones recientes de WhatsApp, algunos usuarios tienen JIDs con formato `@lid` en lugar de `@s.whatsapp.net`. El kit los acepta ambos — no perderás mensajes.

## Desconectar

Desde el panel web → botón "Desconectar". O borra la carpeta `auth/` manualmente.

## Reconexión automática

Si se pierde la conexión (red, reinicio), el bot reconecta automáticamente en 5s. Si el código es 440 (sesión reemplazada), espera 15s antes de reconectar para evitar loops.
