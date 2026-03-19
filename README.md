> **© 2026 Hexadian Corporation** — Licensed under [PolyForm Noncommercial 1.0.0 (Modified)](./LICENSE). No commercial use, no public deployment, no plagiarism. See [LICENSE](./LICENSE) for full terms.

# hhh-backoffice-frontend

Backoffice frontend for **H³ – Hexadian Hauling Helper**.

## Purpose

Administration panel for managing users, roles, permissions, and system configuration.

## Stack

- React 19 + TypeScript
- Vite 8
- Port: 3001

## Quick Start

```bash
npm install
npm run dev
```

## Authentication

The backoffice uses an **auth portal redirect flow**. Users without a valid JWT are
redirected to the auth portal (`http://localhost:3003`) for login, then redirected back
with an authorization code that is exchanged for tokens.

### Flow

1. `AuthGuard` checks for a valid `access_token` in `localStorage`.
2. If missing or expired, the user is redirected to `{VITE_AUTH_PORTAL_URL}/login`.
3. After login, the auth portal redirects to `/callback` with `code` and `state` params.
4. The `CallbackPage` exchanges the code for tokens via `POST /auth/token/exchange`.
5. Tokens are stored in `localStorage` and the user is sent to their original route.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_AUTH_PORTAL_URL` | `http://localhost:3003` | Auth portal base URL |
| `VITE_AUTH_API_URL` | `http://localhost:8006` | Auth service API base URL |
| `VITE_CONTRACTS_API_URL` | `http://localhost:8001` | Contracts service API |
| `VITE_MAPS_API_URL` | `http://localhost:8003` | Maps/locations service API |
| `VITE_COMMODITIES_API_URL` | `http://localhost:8007` | Commodities service API |

## Run in Docker (full stack)

From the monorepo root (`hexadian-hauling-helper`):

```bash
uv run hhh up
```

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
