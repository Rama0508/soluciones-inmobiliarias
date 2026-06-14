# 04 — Configurar las herramientas del agente

El agente tiene 4 tools. Dos son opcionales (requieren configuración), dos funcionan siempre.

---

## `guardarLead` — Google Sheets (opcional)

Guarda los datos del lead en una hoja de Google Sheets.

**Configurar**:
1. Crea un Google Apps Script con `doPost(e)` que reciba JSON y lo escriba en Sheets
2. Publica como Web App (ejecutar como tú, acceso: cualquiera)
3. Copia la URL y añádela en `.env.local`:
   ```
   GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
   ```

**Si no está configurada**: la tool devuelve `{ok:false}` y el agente continúa sin guardar.

---

## `agendar` — Cal.com o Calendly (opcional)

Genera un link personalizado para que el lead agende una llamada.

**Configurar**:
1. Crea tu cuenta en Cal.com o Calendly
2. Crea un tipo de evento (ej: "Diagnóstico gratuito 30min")
3. Copia la URL del evento y añádela en `.env.local`:
   ```
   CAL_BOOKING_URL=https://cal.com/tu-usuario/diagnostico
   ```

O ejecuta `/personaliza` — te pregunta por esto automáticamente.

**Si no está configurada**: la tool devuelve `{ok:false}` y el agente informa que no puede agendar.

---

## `calificar` — Siempre activa

Calcula un score del 1 al 10 basado en 5 criterios booleanos. Si score >= 7, el agente procede a agendar.

**Criterios y pesos** (en `src/lib/tools/calificar.ts`):
- Tiene negocio activo: +3
- Factura más de 5k/mes: +3
- Dolor encaja con propuesta: +2
- Urgencia alta: +1
- Presupuesto confirmado: +1

Los pesos son ajustables editando `calificar.ts`. El umbral (7) está en el system prompt y en el código.

---

## `derivarHumano` — Siempre activa

Cambia la conversación a modo HUMAN. El agente la usa cuando el lead pide precios específicos, tiene quejas, o la consulta está fuera de su alcance.

**No requiere configuración**. Funciona cambiando `conversations.mode` de `AI` a `HUMAN` en la DB.
