# Guía completa — De cero a producción

---

## Fase 1 — Instalar y conectar

### Requisitos previos
- Node.js 22 (o mínimo 20.9). Descarga: https://nodejs.org
- En Windows: Git for Windows (para tener Bash) y Visual Studio Build Tools
- Cuenta en OpenRouter: https://openrouter.ai

### Instalación
1. Abre esta carpeta en VS Code con Claude Code
2. Ejecuta `/setup` — Claude instala dependencias, pide la API key y conecta WhatsApp
3. Alternativa sin Claude Code: `npm run wizard` en terminal

### Qué pasa al conectar
- Baileys abre una sesión de WhatsApp Web
- La sesión se guarda en `auth/` (no se versiona)
- El estado de conexión vive en `data/messages.db` (tabla `connection_state`)
- El panel muestra el QR hasta que escaneas; luego pasa a la bandeja

---

## Fase 2 — Entrenar el agente

### Ejecuta `/personaliza`
Claude te hace 6 preguntas (una a la vez):
1. Nombre del negocio
2. A qué se dedica
3. Propuesta de valor
4. Preguntas de calificación al lead
5. Criterios de lead bueno vs malo
6. Acción cuando el lead encaja (Cal.com, pago, humano)

### Resultado
Se crea `prompts/negocio.md` con tus respuestas. El sistema prompt del agente lo lee en cada conversación. Cambiar este fichero requiere reiniciar el bot (Claude lo hace automáticamente).

### Configurar tools opcionales
- **Google Sheets** (leads): añade `GOOGLE_SHEETS_WEBHOOK_URL` en `.env.local`
- **Cal.com** (agenda): añade `CAL_BOOKING_URL` en `.env.local` — o deja que `/personaliza` lo haga

---

## Fase 3 — Desplegar en producción

### Ejecuta `/deploy`
Claude te guía por:
1. Crear repo privado en GitHub
2. Contratar VPS en Hostinger (KVM 2, ~8€/mes)
3. Instalar EasyPanel y conectar el repo
4. Configurar volúmenes persistentes (`/app/data`, `/app/auth`)
5. Añadir variables de entorno
6. Proteger el panel con Cloudflare Access

### Redeploy
Cada `git push` a `main` redespliega automáticamente. El proceso tarda 3-5 minutos.

---

## Fase 4 — Mantenimiento y operación

### Panel de control (`http://localhost:3000` o tu dominio)
- **Bandeja de entrada**: lista de conversaciones con preview y tiempo
- **Toggle Modo IA / Modo Humano**: por conversación, en tiempo real
- **Chat**: mensajes en tiempo real (polling 2s), envío manual en modo Humano
- **Desconectar**: borra la sesión y genera nuevo QR

### Modo IA vs Modo Humano
- **IA (default)**: el agente responde automáticamente con el LLM
- **Humano**: tú respondes desde el panel; el bot entrega los mensajes
- La IA puede derivar a Humano sola (tool `derivarHumano`)
- Cambiar el modo es instantáneo y por conversación

### Diagnóstico
```
npm run doctor    # Diagnóstico completo (10 checks)
npm run check     # Verificación rápida del sistema
```

### Si el bot se desconecta
1. Abre `http://localhost:3000` — muestra el nuevo QR automáticamente
2. O desconecta desde el panel y escanea de nuevo

### Actualizar el prompt del negocio
1. Ejecuta `/personaliza` de nuevo
2. Claude actualiza `prompts/negocio.md` y reinicia el bot

---

## Errores frecuentes

Ver `errores-sesion.md` para la lista completa de errores y soluciones.

Los más comunes:
- **Bot no responde**: verificar modo AI en el panel + `npm run doctor`
- **QR en loop**: código 440 — el backoff de 15s lo resuelve solo
- **better-sqlite3 en Windows**: instalar Visual Studio Build Tools
- **Mensajes perdidos**: soporte de `@lid` ya incluido en el handler
