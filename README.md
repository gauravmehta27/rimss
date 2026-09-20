# RIMSS

Retail Inventory Management System demo built with Angular, Bootstrap, and a local mock GraphQL API.

## Overview

This repository is a front-end working sample for a retail storefront and operations experience. It includes:

- a plugin-based Angular app shell
- storefront pages for home, catalog, and cart
- an inventory management screen
- routing and feature flags driven from a single manifest
- a local Express + GraphQL mock API for realistic development and testing

Technology stack:

- Angular 22
- standalone app configuration
- zoneless change detection
- AdminLTE 4 + Bootstrap 5
- GraphQL-based mock backend
- Node.js development tooling

---

## Quick start

```bash
npm install
npm start
```

This runs:

- the mock API on http://127.0.0.1:3000
- the Angular SSR server on http://localhost:4000

The app is configured to talk to the mock API at `http://localhost:3000/api` in development.

### Available scripts

| Script | Purpose |
| --- | --- |
| `npm start` | Builds and runs the Angular SSR server with the mock API |
| `npm run serve:web` | Runs the Angular app without the mock API |
| `npm run mock-api` | Starts only the mock API |
| `npm run build` | Production build for the Angular app |
| `npm run preview` | Builds the app and serves the production bundle through the mock API |
| `npm run build:icons` | Regenerates the Bootstrap icon subset used by the app |
| `npm run watch` | Angular build in watch mode |
| `npm run test` | Runs unit tests in watch mode |
| `npm run test:ci` | Runs unit tests once with no watch |
| `npm run lint:format` | Checks formatting with Prettier |

---

## Feature set

The application is split into plugin-driven feature modules registered in `src/app/plugins/plugin.manifests.ts`.

| Module | Description |
| --- | --- |
| Home | Landing page and featured products |
| Catalog | Product search, filtering, and showcase pages |
| Cart | Basket and order flow |
| Inventory | Stock monitoring and operational task demo |

Feature flags are defined in `src/environments/environment.ts` and gate the inclusion of routes and navigation entries.

---

## Architecture

```text
src/
├── app/
│   ├── core/
│   │   ├── config/
│   │   ├── graphql/
│   │   ├── interceptors/
│   │   ├── models/
│   │   ├── plugin/
│   │   ├── routing/
│   │   └── services/
│   ├── features/
│   │   ├── cart/
│   │   ├── catalog/
│   │   ├── home/
│   │   └── inventory/
│   ├── layout/
│   ├── plugins/
│   └── shared/
│       └── utils/
├── environments/
├── styles/
├── app.routes.ts
├── app.config.ts
├── main.ts
├── styles.scss
├── index.html
├── public/
├── mock-api/
├── docs/
├── tools/
├── angular.json
├── package.json
├── Jenkinsfile
└── README.md
```

### Plugin model

RIMSS uses a generic plugin manifest that decouples feature discovery from feature loading and rendering. A plugin may contribute lazy-loaded route/module children or a standalone component. Rendering strategy is independently configurable, enabling CSR, SSR or prerendering without changing the application shell.

The shell derives browser routes, sidebar entries, and feature gating from the manifest. Browser loading uses a discriminated `loader` strategy (`children` or `component`), while server-specific code maps the optional framework-neutral `renderMode` (`client`, `server`, or `prerender`) to Angular SSR configuration. Omitting `renderMode` defaults to server rendering.

- Manifest: `src/app/plugins/plugin.manifests.ts`
- Route generation: `src/app/core/plugin/plugin.providers.ts`
- Server-route generation: `src/app/core/plugin/plugin.server-routes.ts`
- Shell route composition: `src/app/app.routes.ts`

This keeps functional modules independently pluggable without needing to touch the shell or navigation layer when adding a new feature.

Lazy loading primarily provides modularity, pluggability, and initial bundle optimization; it does not itself provide SSR. SSR or prerendering can be selected independently for SEO-sensitive public routes. Authenticated or personalized pages such as Cart, and operational pages such as Inventory, can remain client-rendered. Semantic HTML, titles, meta descriptions, canonical URLs, and structured data apply regardless of the loading mechanism.

---

## Mock API

The mock backend lives in `mock-api/server.js` and uses Express with a single GraphQL endpoint for product data and inventory operations.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/products` | Executes GraphQL queries and mutations |
| `GET /api/health` | Health check for local tooling and smoke tests |

Behavior:

- deterministic in-memory seed data
- configurable latency via `MOCK_API_LATENCY` (default: 120ms)
- local-only dev server, no credentials or production deployment path
- production preview mode served by the same mock API when using `npm run preview`

---

## CI and validation

The repository includes a GitHub Actions workflow in `.github/workflows/ci.yml` that runs:

- dependency install
- formatting check
- unit tests
- production build
- artifact upload

Typical validation commands:

```bash
npm run lint:format
npm run test:ci
npm run build
```

---

## Documentation

| Deliverable | File |
| --- | --- |
| Solution approach | `docs/01-solution-approach.md` |
| Build and release strategy | `docs/02-build-strategy.md` |
| Estimation sheet | `docs/03-estimation-sheet.csv` |
| CI pipeline | `.github/workflows/ci.yml` |

---

## Notes

- The app is intended as a local demo and development scaffold rather than a production deployment.
- `npm run preview` is the best command to validate production-like output and performance behavior locally.
- The project uses feature flags to keep optional capability modules off when disabled in `src/environments/environment*.ts`.

