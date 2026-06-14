# 07 — Errores comunes

Para el registro completo de errores y soluciones, ver `errores-sesion.md` en la raíz del proyecto.

---

## Diagnóstico rápido

```bash
npm run doctor    # Diagnóstico completo (5 bloques, 10 checks)
npm run check     # Verificación del sistema (7 checks rápidos)
```

---

## Los 5 errores más frecuentes

### 1. El bot no responde a los mensajes

**Checks en orden**:
1. Verifica en el panel que la conversación está en **Modo IA** (no Modo Humano)
2. `npm run doctor` → revisa OPENROUTER_API_KEY
3. Verifica que el modelo no es `:free` (dan 429 saturados)
4. Confirma que `npm run start:all` sigue corriendo

### 2. El QR no aparece o caduca

- Recarga `http://localhost:3000` — el QR se regenera cada vez
- Si el bot no arrancó: verifica con `npm run doctor`
- Si arrancó pero no hay QR en DB: `SELECT * FROM connection_state WHERE id=1`

### 3. `better-sqlite3` falla al instalar (Windows)

Instala Visual Studio Build Tools y luego:
```bash
npm rebuild better-sqlite3
```

### 4. TypeScript errors en rutas de Next.js 16

Los `params` son ahora `Promise` en Next.js 16:
```ts
interface RouteContext { params: Promise<{ id: string }> }
const { id } = await ctx.params;
```

### 5. Mensajes del dashboard no llegan a WhatsApp

El bot procesa el outbox solo cuando está conectado. Verifica que `npm run start:all` corre y el status es `connected`.

---

## Ver todos los errores

`errores-sesion.md` tiene 15 errores documentados con causa y solución exacta.
