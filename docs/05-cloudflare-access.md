# 05 — Proteger el panel con Cloudflare Access

**Obligatorio antes de poner el kit en producción.** Sin protección, cualquier persona con la URL puede ver tus conversaciones.

---

## Requisitos

- Cuenta en Cloudflare (gratuita)
- Un dominio gestionado en Cloudflare

---

## Configurar Cloudflare Access

1. Ve a **Cloudflare Zero Trust** (zero.cloudflare.com)
2. **Access → Applications → Add an application**
3. Elige **Self-hosted**
4. Configura:
   - **Application name**: Panel WhatsApp
   - **Application domain**: `panel.tu-dominio.com`
5. **Add a policy**:
   - Policy name: Equipo
   - Action: Allow
   - Include → Emails: añade tu email y el de tu equipo
6. **Identity providers**: selecciona **Email One-Time PIN**
   - No requiere OAuth de Google ni configuración extra
   - Cloudflare envía un código al email del usuario para autenticarse

---

## Verificar que funciona

1. Abre `panel.tu-dominio.com` en una ventana de incógnito
2. Con un email **NO autorizado**: debe rechazar el acceso
3. Con tu email autorizado: debe llegar el código OTP y poder entrar

---

## Alternativa sin dominio propio

Si usas el subdominio de EasyPanel (`*.easypanel.host`):
- Configura **Basic Auth** directamente en EasyPanel
- Es menos seguro pero funciona para pruebas

---

## Apuntar el dominio al VPS

En Cloudflare DNS:
- Tipo: A
- Nombre: `panel`
- IPv4: la IP de tu VPS
- Proxy: activado (nube naranja)

EasyPanel necesita que configures el dominio en la app para que responda a ese nombre.
