/* eslint-disable no-console */
/**
 * RIMSS mock API.
 *
 * Stands in for the client-provided backend so the Angular frontend can be
 * developed and demoed end-to-end. The contract is GraphQL: a single
 * `POST /api/products` endpoint plus a plain REST health probe for tooling.
 *
 * Dev-only: no authentication, in-memory state, binds to localhost.
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { graphql } = require('graphql');
const { createState, createSchema, createRootValue } = require('./schema');

const app = express();
const PORT = Number(process.env.MOCK_API_PORT || 3000);
const HOST = '127.0.0.1';
const LATENCY_MS = Number(process.env.MOCK_API_LATENCY || 120);
const DIST_DIR = path.join(__dirname, '..', 'dist', 'rimss', 'browser');
// `npm run preview` passes this so Lighthouse measures the real production
// bundle over one origin, with the compression and caching a CDN would apply.
const SERVE_DIST = process.argv.includes('--serve-dist');

app.use(compression());
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
app.use(express.json({ limit: '100kb' }));

// Simulated network latency + correlation id echo, so the UI's loading states are exercised.
app.use('/api', (req, res, next) => {
  res.setHeader('X-Correlation-Id', req.header('X-Correlation-Id') || randomUUID());
  setTimeout(next, LATENCY_MS);
});

const state = createState();
const schema = createSchema(state);
const rootValue = createRootValue(state);

app.get('/api/health', (_req, res) => res.json({ status: 'up', uptime: process.uptime() }));

app.post('/api/products', async (req, res) => {
  const { query, variables, operationName } = req.body ?? {};

  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({
      errors: [{ message: 'A GraphQL query is required.', extensions: { code: 'BAD_REQUEST' } }],
    });
  }

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables ?? undefined,
      operationName: operationName ?? undefined,
      contextValue: { correlationId: res.getHeader('X-Correlation-Id') },
    });

    if (result.errors?.length) {
      console.warn(
        `[mock-api] ${operationName || 'anonymous'} →`,
        result.errors.map((error) => error.message).join('; '),
      );
    }

    // Execution errors travel in the body alongside a 200, per the GraphQL spec.
    res.json(result);
  } catch (error) {
    console.error('[mock-api] products endpoint failure', error);
    res.status(500).json({
      errors: [{ message: 'Unexpected mock API failure.', extensions: { code: 'INTERNAL_ERROR' } }],
    });
  }
});

if (SERVE_DIST) {
  // Hashed filenames are immutable; index.html must always be revalidated.
  app.use(
    express.static(DIST_DIR, {
      index: false,
      setHeaders: (res, filePath) => {
        const hashed = /-[\w-]{8,}\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg)$/.test(
          path.basename(filePath),
        );
        res.setHeader(
          'Cache-Control',
          hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
        );
      },
    }),
  );
  // SPA fallback: any non-API GET resolves to the Angular entry point.
  app.use((req, res, next) => {
    if (
      !['GET', 'HEAD'].includes(req.method) ||
      req.path === '/api' ||
      req.path.startsWith('/api/') ||
      path.extname(req.path)
    ) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use((req, res) =>
  res.status(404).json({
    errors: [{ message: `No route for ${req.path}`, extensions: { code: 'NOT_FOUND' } }],
  }),
);

app.use((err, _req, res, _next) => {
  console.error('[mock-api] unhandled error', err);
  res.status(500).json({
    errors: [{ message: 'Unexpected mock API failure.', extensions: { code: 'INTERNAL_ERROR' } }],
  });
});

app.listen(PORT, HOST, () => {
  console.log(`[mock-api] RIMSS GraphQL API listening on http://${HOST}:${PORT}/api/products`);
  console.log(
    `[mock-api] ${state.products.length} products seeded, simulated latency ${LATENCY_MS}ms`,
  );
  if (SERVE_DIST) {
    console.log(`[mock-api] serving production build from ${DIST_DIR}`);
  }
});
