# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ai.jakavonis.lt — Landing page + DI Planning Wizard web app for public sector AI system procurement specification. Lithuanian language UI. EU AI Act (ES DI Aktas) compliance framework built-in.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (standalone output)
npm run start        # Start production server
npm run lint         # ESLint
```

### Docker (Contabo deployment)
```bash
docker compose up -d --build   # Build and run
docker compose logs -f web     # View logs
```

## Architecture

- **Next.js 16 + TypeScript + Tailwind CSS 4** (App Router, `src/` directory)
- **`/`** — Landing page (server component) — hero, features, compliance overview, CTA to wizard
- **`/wizard`** — DI Planning Wizard (client component, `"use client"`) — 5-step form:
  1. Problema (problem definition, risk level, stakeholders)
  2. Sistemos konceptas (model strategy, GDPR, oversight level, phases)
  3. Evals / Metrikos (19 metrics across 6 categories, scored 0-3)
  4. Architektūra (8 components, data flow, infrastructure, risks)
  5. Ataskaita / TS (report preview, JSON export for DOCX generation)

### Key Files
- `src/app/wizard/DIPlanningWizard.tsx` — Main wizard (1500+ lines, all inline styles, no Tailwind)
- `src/app/page.tsx` — Landing page (Tailwind CSS)
- `src/app/globals.css` — Custom theme colors via `@theme inline`
- `files/` — Original source files and DOCX generator (`generate-ts-docx.js`)

### Design System (globals.css theme)
- `--color-background: #0f172a` (slate-900)
- `--color-primary: #1e40af` / `--color-primary-light: #3b82f6`
- `--color-accent: #059669` / `--color-accent-light: #6ee7b7`
- `--color-surface: #1e293b` / `--color-surface-light: #334155`

## Deployment

- **Domain:** ai.jakavonis.lt (Contabo VPS)
- **Docker:** standalone Next.js output, port 3100 -> 3000 internal
- **Reverse proxy:** Traefik labels configured in docker-compose.yml
- **SSL:** Let's Encrypt via Traefik certresolver

## Notes

- Wizard uses inline styles (not Tailwind) — this is intentional, preserved from original JSX
- Lithuanian special characters (ą, č, ę, ė, į, š, ų, ū, ž) used throughout UI
- `files/generate-ts-docx.js` is a standalone Node.js script (not part of the web app) — generates DOCX from wizard JSON export
