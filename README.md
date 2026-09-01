# RIMSS — Retail Inventory Management Software System

Frontend working sample for the YCompany case study.
**Angular 22** (standalone, signals, zoneless) · **AdminLTE 4** / Bootstrap 5 · **Node.js mock API**.

---

## Quick start

```bash
npm install
npm start
```

`npm start` runs the mock API on **:3000** and the Angular dev server on **:4200** together and
opens the browser. Requests to `/api` are proxied to the mock server.

| Script | Purpose |
| --- | --- |
| `npm start` | Mock API + dev server (recommended) |
| `npm run serve:web` | Dev server only |
| `npm run mock-api` | Mock API only |
| `npm run build` | Production build into `dist/rimss/browser` |
| `npm run test` | Unit tests (watch) |
| `npm run test:ci` | Unit tests (single run) |
| `npm run lint:format` | Prettier check |

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
| Unit tests for the business layer | 38 tests across 5 suites |
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

`mock-api/server.js` (Express, in-memory, deterministic seed of 132 products / 2 182 SKUs).

| Endpoint | Description |
| --- | --- |
| `GET /api/products` | Search with facets, sorting and pagination |
| `GET /api/products/featured` | Featured products |
| `GET /api/products/facets` | Facet counts and price range |
| `GET /api/products/suggestions?q=` | Type-ahead suggestions |
| `GET /api/products/:id` | Product detail + related items |
| `GET /api/offers` | Promotional offers |
| `GET /api/inventory` | SKU stock positions (filter + paging) |
| `GET /api/inventory/summary` | KPIs and recent stock movements |
| `PATCH /api/inventory/:sku` | Adjust stock (`delta` or absolute `quantity`) |
| `GET /POST /api/orders` | List / place orders |

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
