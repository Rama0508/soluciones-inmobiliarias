---
description: Personaliza el agente de IA con los datos del negocio. Crea o actualiza prompts/negocio.md haciendo preguntas una a una.
---

# /personaliza — Configurar el agente para tu negocio

**Patrón obligatorio**: una pregunta a la vez. Nunca hagas las 6 preguntas de golpe.

---

## Si `prompts/negocio.md` ya existe

Muestra las 3 opciones:
1. Sobrescribir todo (empezar de cero con las 6 preguntas)
2. Editar una sección concreta (pregunta cuál)
3. Cancelar

---

## Las 6 preguntas (una a la vez, en este orden)

Espera la respuesta del usuario antes de hacer la siguiente.

**1. Nombre del negocio**
*"¿Cómo se llama tu negocio o marca?"*

**2. A qué se dedica**
*"¿A qué se dedica exactamente? (Una o dos frases claras)"*

**3. Propuesta de valor**
*"¿Qué hace diferente a tu negocio? ¿Por qué te eligen a ti y no a la competencia?"*

**4. Preguntas de calificación al lead**
*"¿Qué preguntas haces para saber si alguien encaja como cliente? (Dame al menos 2, por ejemplo: ¿tiene negocio activo?, ¿cuánto factura al mes?)"*
- Si da solo 1 pregunta: pide al menos una más.

**5. Criterios de lead bueno vs malo**
*"¿Cómo defines a un lead que encaja perfecto? ¿Y uno que no encaja?"*

**6. Acción cuando el lead encaja**
*"Cuando alguien califica, ¿qué quieres que haga el agente? ¿Agendar llamada en Cal.com, enviar link de pago, o pasarle a un humano?"*
- Si elige Cal.com: pide el link y guárdalo en `CAL_BOOKING_URL` en `.env.local`.

---

## Resumen y confirmación

Antes de escribir el fichero, muestra un resumen de las 6 respuestas y pregunta: *"¿Esto está bien? ¿Cambias algo antes de guardarlo?"*

---

## Escribir `prompts/negocio.md`

Formato exacto del fichero:

```markdown
---
nombre: [nombre del negocio]
actividad: [a qué se dedica]
generado: [ISO timestamp]
---

# Datos del negocio

## Nombre
[nombre del negocio]

## A qué se dedica
[a qué se dedica — 1-2 frases]

## Propuesta de valor
[propuesta de valor]

## Preguntas de calificación al lead
[las preguntas, en lista]

## Criterios de lead bueno vs malo
**BUENO**: [criterios]
**MALO**: [criterios]

## Acción cuando el lead encaja
[acción — link Cal.com / link de pago / derivar humano]
```

---

## Validación tras escribir

Verifica que el fichero tiene exactamente las 6 secciones H2. Si falta alguna, escríbela.

---

## Reiniciar el bot

Escribe `data/.restart` (fichero vacío) para que el proceso bot recoja el nuevo prompt.

El bot tarda ~1s en detectar el flag y reiniciar. Confirma al usuario: *"El agente ya conoce los datos de tu negocio. Prueba enviando un mensaje desde otro móvil."*

---

## Nota

Cambiar `negocio.md` requiere reiniciar el bot. El sistema lo hace automáticamente al escribir el flag `.restart`.
