# Empieza aquí

Tienes el kit en tu carpeta. En 3 pasos tienes el agente funcionando.

---

## Paso 1 — Abre esta carpeta en VS Code con Claude Code

Abre VS Code, abre esta carpeta (`whatsapp-ai-agent-kit/`) y activa Claude Code.

> Si no tienes Claude Code: instálalo desde el marketplace de VS Code. Necesitas Claude Pro (~20$/mes).

---

## Paso 2 — Ejecuta `/setup`

En el chat de Claude Code escribe:

```
/setup
```

Claude te guiará para:
- Instalar dependencias
- Configurar tu API key de OpenRouter
- Conectar WhatsApp escaneando un QR

**No abras la terminal.** Claude lo hace todo por ti.

---

## Paso 3 — Personaliza el agente con `/personaliza`

Cuando WhatsApp esté conectado, escribe:

```
/personaliza
```

Claude te hará 6 preguntas sobre tu negocio (una a la vez) y configurará el agente para que responda como tú quieres.

---

## ¿Quieres ponerlo 24/7 en producción?

Ejecuta `/deploy` para subirlo a un VPS con EasyPanel.

---

## Alternativa sin Claude Code

Si no tienes Claude Pro, puedes usar el asistente de línea de comandos:

```
npm run wizard
```

Abre una terminal (Git Bash en Windows), navega a esta carpeta y ejecuta ese comando.

> **Nota Windows**: Claude Code requiere shell Bash. Instala Git for Windows si no lo tienes.

---

## Soporte

¿Algo no funciona? Consulta `errores-sesion.md` o pregunta en La Tribu Divisual: https://www.skool.com/la-tribu-divisual
