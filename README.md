# RIMMS — Retail Inventory Management Software System

Frontend working sample for the YCompany case study.
**Angular 22** (standalone, signals, zoneless) · **AdminLTE 4** / Bootstrap 5 · **Node.js mock API**.

---

## Quick start

```bash
npm install
npm start
```

`npm start` runs the mock API on **:3000** and the Angular dev server on **:4200** together and
opens the browser. The development environment connects directly to the mock API on **:3000**.

| Script | Purpose |
| --- | --- |
| `npm start` | Mock API + dev server (recommended) |
| `npm run serve:web` | Dev server only |
| `npm run mock-api` | Mock API only |
| `npm run build` | Production build into `dist/rimms/browser` |
| `npm run preview` | Build and serve optimized app + mock API on port 3000 |
| `npm run build:icons` | Regenerate the used Bootstrap icon subset after adding icons |
| `npm run test` | Unit tests (watch) |
| `npm run test:ci` | Unit tests (single run) |
| `npm run lint:format` | Prettier check |

### Lighthouse validation

Use `npm run preview`, then audit **http://127.0.0.1:3000/home** in Chrome Lighthouse.
Stop the existing mock API first if port 3000 is occupied, or set `MOCK_API_PORT` to
an unused port before starting the preview. This remains a localhost-only demo,
not a production deployment server.

Do not use the development server on port 4200 for production scores: it serves
unminified code, source maps and development tooling. The preview serves the
optimized build with compression, immutable caching for hashed assets, and
revalidation for the entry document and unhashed public assets.

Compare cold-cache runs using the same device and throttling settings. Record LCP,
FCP, CLS and TBT as well as category scores; Unsplash network timing can vary.
The initial hero image is preloaded, while product photos use responsive lazy
images. Their inline SVG backgrounds are local fallbacks, not extra network requests.

---

## What is implemented

| Requirement | Where |
| --- | --- |
| Plugin-based architecture | `src/app/core/plugin`, `src/app/plugins/plugin.manifests.ts` |
| Functional module — product **search** | `src/app/features/catalog/product-search` |
| Functional module — product **showcase** | `src/app/features/catalog/product-showcase` |
| Sample operational task — **stock control** | `src/app/features/inventory` |
| Storefront home + basket | `src/app/features/home`, `src/app/features/cart` |
| Responsive, cross-platform UI | AdminLTE shell in `src/app/layout` |
| Unit tests for the business layer | 46 tests across 7 suites |
| Mock APIs | `mock-api/` (Express) |
| n-tier separation | component → store → service → HTTP interceptor chain → API |

---

## Architecture at a glance

```
src/app
├── core/                  Framework-level, app-wide
│   ├── config/            APP_CONFIG token + feature flags
│   ├── interceptors/      correlation+logging · loading · cache · error
│   ├── models/            Typed API contracts
│   ├── plugin/            Manifest contract, registry, route projection
│   └── services/          Data access + cross-cutting services
├── features/              Pluggable functional modules (lazy loaded)
│   ├── home/  catalog/  cart/  inventory/
├── layout/                AdminLTE shell: header, sidebar, footer, toasts
├── plugins/               THE module manifest — single registration point
└── shared/                Presentational components and utilities
```

### Adding a new module

1. Create `src/app/features/<name>/` with a `<name>.routes.ts` default export.
2. Append one entry to `PLUGIN_MANIFESTS` in `src/app/plugins/plugin.manifests.ts`.

The sidebar entry, the lazy route and the feature-flag gate are all derived from that manifest.
No shell, routing or navigation file is touched.

### Turning a module off

Set its flag to `false` in `src/environments/environment*.ts`. The route is not registered, the
navigation entry disappears and the bundle is never downloaded.

---

## Mock API

`mock-api/server.js` (Express GraphQL API, in-memory, deterministic seed of 132 products / 2 182 SKUs).

| Endpoint | Description |
| --- | --- |
| `POST /api/products` | GraphQL queries and mutations for catalogue, offers, inventory and orders |
| `GET /api/health` | Health probe for local tooling |

A configurable latency (`MOCK_API_LATENCY`, default 120 ms) keeps loading states realistic.
The mock server is a development tool only: it binds to localhost, holds no credentials and is
never deployed.

---

## Documentation

| Deliverable | File |
| --- | --- |
| Solution approach (diagrams, architecture, NFRs, performance, scope) | [docs/01-solution-approach.md](docs/01-solution-approach.md) |
| Build & release strategy (one pager) | [docs/02-build-strategy.md](docs/02-build-strategy.md) |
| Estimation sheet | [docs/03-estimation-sheet.csv](docs/03-estimation-sheet.csv) |
| CI pipeline | [.github/workflows/ci.yml](.github/workflows/ci.yml) |
