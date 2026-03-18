<critical>Note: This is a living document and will be updated as we refine our processes. Always refer back to this for the latest guidelines. Update whenever necessary.</critical>

<critical>**Development Workflow:** All changes go through a branch + PR — no direct commits to `main` unless explicitly instructed. See `.github/instructions/development-workflow.instructions.md`.</critical>

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

## UI Styling

See `hexadian-ui-style.instructions.md` for the canonical Hexadian corporate style guide (color palette, layout, typography, components, Tailwind classes).

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

## CI & Branch Protection

**Required status checks** (all with `app_id: 15368` — GitHub Actions):

| Check | What it does |
|-------|--------------|
| `Lint & Type Check` | `npm run lint` + `npx tsc --noEmit` |
| `Tests & Coverage` | `vitest` + `diff-cover` (≥90 % on changed lines) |
| `Validate PR Title` | Conventional-commit format |
| `Secret Scan` | Gitleaks |

> **Critical:** Required status checks must always use `app_id: 15368` (GitHub Actions). Using `app_id: null` causes checks to freeze as "Expected — Waiting for status" for any check name not previously reported on `main`. See BUG-011.

## Tooling

| Action | Command |
|--------|--------|
| Install deps | `npm install` |
| Dev server | `npm run dev` |
| Run in Docker | `uv run hhh up` (from monorepo root) |
| Run tests | `npm test` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |

## Maintenance Rules

- **Keep the README up to date.** When you add, remove, or change commands, environment variables, API endpoints, or architecture — update `README.md`. The README is the source of truth for developers.
- **Keep the monorepo CLI service registry up to date.** When adding or removing a service, update `SERVICES`, `FRONTENDS`, `COMPOSE_SERVICE_MAP`, and `SERVICE_ALIASES` in `hexadian-hauling-helper/hhh_cli/__init__.py`, plus the `docker-compose.yml` entry.

## Organization Profile Maintenance

- **Keep the org profile README up to date.** When repositories, ports, architecture, workflows, security policy, or ownership change, update Hexadian-Corporation/.github/profile/README.md in the public .github repo.
- **Treat the org profile as canonical org summary.** Ensure descriptions in this repo remain consistent with the organization profile README.

Remember, before finishing: resolve any merge conflict and merge source (PR origin and destination) branch into current one.