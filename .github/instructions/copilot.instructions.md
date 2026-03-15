<critical>Note: This is a living document and will be updated as we refine our processes. Always refer back to this for the latest guidelines. Update whenever necessary.</critical>

# Copilot Instructions — hhh-backoffice-frontend

## Project Context

**H³ (Hexadian Hauling Helper)** is a Star Citizen companion app for managing hauling contracts, owned by **Hexadian Corporation** (GitHub org: `Hexadian-Corporation`).

This is the **admin backoffice** — where administrators manage contracts, locations, ships, and other game data.

- **Repo:** `Hexadian-Corporation/hhh-backoffice-frontend`
- **Port:** 3001
- **Stack:** React 19 · TypeScript 5.9 · Vite 8 · React Router v7 · Tailwind CSS v4 · shadcn/ui · lucide-react

## Project Structure

```
src/
├── main.tsx                         # App entry point
├── index.css                        # Tailwind CSS entry
├── api/                             # API client modules (fetch-based)
├── components/                      # Reusable UI components (shadcn/ui)
├── layouts/                         # Layout components
├── lib/                             # Utility functions
├── pages/                           # Page components (mapped to routes)
├── types/                           # TypeScript types (mirrors backend DTOs)
└── __tests__/                       # Test files
```

**Key conventions:**
- API clients use `fetch` with configurable base URL via `VITE_{SERVICE}_API_URL`
- Types in `src/types/` must align with backend DTOs
- shadcn/ui components in `src/components/ui/`
- Vitest for testing with `@vitest/coverage-v8`

## UI Design — Hexadian Branding

Dark space theme with CSS custom properties:
- Background: `#0a0e17` / Surface: `#111827` / Accent: `#06b6d4` (cyan)
- Status badges: draft (gray), active (cyan), expired (amber), cancelled (red)

## Issue & PR Title Format

**Format:** `<type>(backoffice): description`

- Example: `feat(backoffice): contract list page`
- Example: `fix(backoffice): resolve form submission error`

**Allowed types:** `chore`, `fix`, `ci`, `docs`, `feat`, `refactor`, `test`, `build`, `perf`, `style`, `revert`

The issue title and PR title must be **identical**. PR body must include `Fixes #N`.

## Quality Standards

- `npm run lint` + `npx tsc --noEmit` must pass
- Vitest with ≥90% coverage on changed lines (`diff-cover` via `pipx`)
- Squash merge only — PR title becomes the commit message

## Tooling

| Tool | Command |
|------|---------|
| Dev server | `npm run dev` |
| Run tests | `npm test` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
