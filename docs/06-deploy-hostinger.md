# 06 — Deploy en Hostinger VPS + EasyPanel

---

## Contratar el VPS

1. Ve a Hostinger y contrata un **VPS con Ubuntu 24.04 y Docker preinstalado**
2. **Recomendado: KVM 2** (~8€/mes) — 8GB RAM, 2 vCPU
   - El cuello de botella es CPU (WebSocket + cifrado), no RAM (~150MB por agente)
3. Anota la IP del VPS

---

## Instalar EasyPanel

Conéctate al VPS por SSH y ejecuta:

```bash
docker run --rm -it \
  -v /etc/easypanel:/etc/easypanel \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  easypanel/easypanel setup
```

Accede a `http://<IP-VPS>:3000` para ver el panel de EasyPanel. Edición self-hosted Developer: **gratuita**.

---

## Preparar el repositorio

Sigue `docs/05-cloudflare-access.md` y el flujo de `/deploy` para crear el repo privado en GitHub y hacer el primer push.

---

## Crear la app en EasyPanel

1. **Create → App**
2. Source: GitHub → conecta tu cuenta → selecciona el repo
3. Branch: `main`
4. Build path: `/`
5. Builder: **Nixpacks** (EasyPanel lo detecta por `nixpacks.toml`)

---

## Configurar volúmenes (ANTES de hacer Deploy)

Sin estos volúmenes, la DB y la sesión de WhatsApp se borran en cada redeploy.

En EasyPanel → tu app → **Volumes**:

| Ruta en contenedor | Descripción |
|---|---|
| `/app/data` | Base de datos SQLite |
| `/app/auth` | Sesión de WhatsApp |

---

## Variables de entorno

En EasyPanel → tu app → **Environment**:

```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=3000
LOG_LEVEL=warn
GOOGLE_SHEETS_WEBHOOK_URL=  (si lo usas)
CAL_BOOKING_URL=            (si lo usas)
```

**Aviso de seguridad**: las variables aparecen en texto plano en el log de build. Si compartes el log, rota la API key después.

---

## Deploy

1. Pulsa **Deploy** en EasyPanel
2. El build tarda 3-5 minutos (compila `better-sqlite3` + Next.js)
3. Cuando termine, accede al dominio configurado
4. Escanea el QR con WhatsApp

---

## Redeploy (actualizaciones)

```bash
git add .
git commit -m "descripcion del cambio"
git push
```

EasyPanel detecta el push y redespliega automáticamente.

---

## Nota sobre Nixpacks

Nixpacks está en modo mantenimiento (Railway migró a Railpack). Si en 12-18 meses el build falla por cambios en Nixpacks, la migración a `Dockerfile` es sencilla — EasyPanel lo soporta nativamente.
