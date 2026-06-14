# WhatsApp AI Agent Kit

Kit llave en mano para montar un agente de IA en WhatsApp con panel web de control.

Para dueños de negocio, freelancers y agencias que quieren **atender y captar clientes** en WhatsApp con IA — sin programar.

---

## Qué hace

- Conecta un número de WhatsApp por QR (sin API oficial)
- Responde automáticamente con un LLM entrenado en tu negocio
- Califica leads, agenda llamadas y deriva a humano cuando hace falta
- Panel web con bandeja de entrada: toggle Modo IA / Modo Humano por conversación
- Despliegue 24/7 en VPS (Hostinger + EasyPanel), panel protegido con Cloudflare Access

---

## Requisitos

- Node.js 20+ (recomendado: 22)
- Cuenta en OpenRouter (para el LLM)
- Claude Code con Claude Pro (~20$/mes) — o usar `npm run wizard` como fallback

---

## Empezar en 3 pasos

1. Abre esta carpeta en VS Code con Claude Code
2. Ejecuta `/setup` en el chat
3. Ejecuta `/personaliza` para entrenar el agente con tu negocio

Ver `EMPIEZA-AQUI.md` para instrucciones detalladas.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| WhatsApp | Baileys 6.7+ (Web unofficial) |
| IA / LLM | OpenRouter + SDK de OpenAI |
| Base de datos | SQLite vía better-sqlite3 |
| Dashboard | Next.js 16 + React 19 + Tailwind v4 |
| Runtime bot | tsx (ESM, Node 22) |
| Despliegue | Nixpacks + EasyPanel + Hostinger VPS |

---

## Estructura

```
whatsapp-ai-agent-kit/
├── scripts/          # Bot y scripts de diagnóstico
├── src/
│   ├── app/          # Next.js (dashboard + API routes)
│   ├── components/   # UI del panel
│   └── lib/          # DB, OpenRouter, Baileys, tools
├── prompts/          # Plantilla y ejemplos de negocio.md
├── docs/             # Documentación paso a paso
└── .claude/          # Comandos y agentes de Claude Code
```

---

## Herramientas del agente

| Tool | Propósito | Requiere |
|---|---|---|
| `guardarLead` | Guarda datos en Google Sheets | `GOOGLE_SHEETS_WEBHOOK_URL` |
| `calificar` | Score 1-10, decide si agendar | — |
| `agendar` | Link de Cal.com/Calendly | `CAL_BOOKING_URL` |
| `derivarHumano` | Cambia a modo humano | — |

---

## Tarifas de mercado

Si implementas esto para clientes, estas son las tarifas orientativas de mercado:

- **Diagnóstico inicial**: 150–300€
- **Implementación completa**: 800–1.500€
- **Mantenimiento mensual**: 80–200€/mes

---

## Soporte y comunidad

La Tribu Divisual: https://www.skool.com/la-tribu-divisual

---

## Licencia

Licencia exclusiva Tribu. Uso permitido para clientes propios. No redistribuir el código fuente.
