# 01 — Instalación

## Requisitos

- Node.js 22 (mínimo 20.9.0) — https://nodejs.org
- npm 10+
- En Windows: Git for Windows + Visual Studio Build Tools (para better-sqlite3)
- Cuenta en OpenRouter — https://openrouter.ai

## Con Claude Code (recomendado)

1. Abre esta carpeta en VS Code
2. Activa Claude Code
3. Ejecuta `/setup` en el chat

Claude instala dependencias, configura la API key y conecta WhatsApp.

## Sin Claude Code (fallback)

```bash
npm run wizard
```

O paso a paso:

```bash
npm install
npm run build
cp .env.example .env.local
# Edita .env.local y añade OPENROUTER_API_KEY
npm run start:all
```

## Verificar instalación

```bash
npm run check    # 7 checks del sistema
npm run typecheck  # TypeScript sin errores
```

## Problemas comunes

Ver `docs/07-errores-comunes.md` y `errores-sesion.md`.
