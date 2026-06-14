---
description: Despliega el kit en un VPS de Hostinger con EasyPanel (Nixpacks, sin Docker) y protege el panel con Cloudflare Access.
---

# /deploy — Despliegue en producción

Sigue las partes en orden. **El panel NUNCA debe quedar expuesto sin Cloudflare Access.**

---

## Parte 0 — Repositorio privado en GitHub (obligatorio antes de subir nada)

1. Verifica que Git está instalado: `git --version`.
2. Verifica autenticación de gh: `gh auth status`.
3. Según el resultado:
   - **gh logueado**: `gh repo create <nombre-kit> --private --source=. --remote=origin --push`
   - **gh sin login**: `gh auth login` (sigue el flujo interactivo)
   - **Sin gh**: crear Personal Access Token en GitHub (fine-grained, Contents: Read & Write) y configurar remote manualmente.
4. **El repositorio es PRIVADO siempre.** Las claves de API vivirán en EasyPanel, no en el código.

### Verificación de seguridad obligatoria

Antes del primer commit:
```
git status --short
```
Comprueba que NO aparecen: `.env.local`, `data/`, `auth/`. El `.gitignore` ya los excluye; `.env.example` SÍ debe subirse.

---

## Parte 1 — VPS en Hostinger

1. Contrata VPS Ubuntu 24.04 con Docker preinstalado. **Recomendado: KVM 2** (8GB RAM, 2 vCPU, ~8€/mes). El cuello de botella real son las vCPU (WebSocket + cifrado), no la RAM (~150MB por agente).
2. Instala EasyPanel (panel gratuito de gestión):
   ```
   docker run --rm -it \
     -v /etc/easypanel:/etc/easypanel \
     -v /var/run/docker.sock:/var/run/docker.sock:ro \
     easypanel/easypanel setup
   ```
3. Accede a `http://<IP-VPS>:3000` — esta es la interfaz de EasyPanel (edición self-hosted Developer, GRATIS).

---

## Parte 2 — Crear la app en EasyPanel

1. Create → App
2. Source: GitHub → selecciona el repo privado
3. Branch: `main`
4. Build path: `/`
5. Builder: **Nixpacks** (autodetecta por `nixpacks.toml`)

### Volúmenes persistentes (CRÍTICOS — configurar ANTES de hacer Deploy)

Sin estos volúmenes, la DB y la sesión de WhatsApp se pierden en cada redeploy:

| Ruta en contenedor | Propósito |
|---|---|
| `/app/data` | Base de datos SQLite (conversaciones, mensajes, outbox) |
| `/app/auth` | Sesión de WhatsApp — sin esto hay que reescanear QR en cada deploy |

### Variables de entorno en EasyPanel

Añade las mismas variables que en `.env.local`:
- `OPENROUTER_API_KEY` (obligatoria)
- `OPENROUTER_MODEL` (recomendado: `openai/gpt-4o-mini`)
- `GOOGLE_SHEETS_WEBHOOK_URL` (si usas la tool de leads)
- `CAL_BOOKING_URL` (si usas Cal.com)
- `LOG_LEVEL=warn` (en producción, para reducir ruido)

**Aviso**: las variables se inyectan como `--build-arg` y aparecen en TEXTO PLANO en el log de build. Si compartes el log, **rota la key después**.

---

## Parte 3 — Cloudflare Access (OBLIGATORIO antes de usar en producción)

El panel de WhatsApp es privado — sin protección cualquiera con la URL puede ver tus conversaciones.

1. Cloudflare Zero Trust → Access → Applications → Self-hosted
2. Application domain: `panel.tu-dominio.com`
3. Policy: Allow → Include = Emails (añade tu email y el de tu equipo)
4. Identity provider recomendado: **Email One-Time PIN** (cero configuración, sin OAuth de Google)
5. Prueba en incógnito con un email NO autorizado — debe rechazar.
6. Alternativa sin dominio propio: Basic Auth en EasyPanel sobre el dominio `*.easypanel.host`.

---

## Parte 4 — Deploy y primer arranque

1. Pulsa Deploy en EasyPanel. El build tarda 3-5 min (compila `better-sqlite3` nativo + Next.js).
2. Cuando termine, abre el dominio configurado.
3. Escanea el QR desde WhatsApp → Dispositivos vinculados.
4. Envía un mensaje de prueba desde otro móvil para verificar que el agente responde.

---

## Redeploy (actualizaciones futuras)

```
git add .
git commit -m "update"
git push
```

EasyPanel detecta el push y redespliega automáticamente.

---

## Nota sobre Nixpacks

Nixpacks está en modo mantenimiento (Railway lanzó Railpack como sucesor). Si en 12-18 meses el build falla, migrar a un `Dockerfile` es sencillo — EasyPanel lo soporta. Documenta la migración si ocurre.
