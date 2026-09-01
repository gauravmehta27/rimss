/* eslint-disable no-console */
/**
 * RIMSS mock API.
 *
 * Stands in for the client-provided backend so the Angular frontend can be
 * developed and demoed end-to-end. Endpoints intentionally mirror a realistic
 * REST contract (pagination, facets, correlation ids, error envelopes).
 *
 * Dev-only: no authentication, in-memory state, binds to localhost.
 */

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('node:crypto');
const { PRODUCTS, OFFERS, CATEGORIES, COLOURS } = require('./data/catalogue');

const app = express();
const PORT = Number(process.env.MOCK_API_PORT || 3000);
const HOST = '127.0.0.1';
const LATENCY_MS = Number(process.env.MOCK_API_LATENCY || 120);

app.use(cors({ origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }));
app.use(express.json({ limit: '100kb' }));

// Simulated network latency + correlation id echo, so the UI's loading states are exercised.
app.use((req, res, next) => {
  res.setHeader('X-Correlation-Id', req.header('X-Correlation-Id') || randomUUID());
  setTimeout(next, LATENCY_MS);
});

/** In-memory mutable state (reset on restart). */
const state = {
  products: PRODUCTS.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) })),
  orders: [],
  stockMovements: [],
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const asArray = (value) =>
  value === undefined || value === null || value === ''
    ? []
    : Array.isArray(value)
      ? value
      : String(value).split(',').filter(Boolean);

const toListItem = (p) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  categoryId: p.categoryId,
  categoryName: p.categoryName,
  department: p.department,
  audience: p.audience,
  material: p.material,
  shortDescription: p.shortDescription,
  price: p.price,
  listPrice: p.listPrice,
  discountPercent: p.discountPercent,
  currency: p.currency,
  rating: p.rating,
  reviewCount: p.reviewCount,
  colors: p.colors,
  sizes: p.sizes,
  stock: p.stock,
  inStock: p.inStock,
  featured: p.featured,
  isNew: p.isNew,
  tags: p.tags,
  imageSeed: p.imageSeed,
  createdAt: p.createdAt,
});

function applyFilters(query) {
  const term = String(query.search || '')
    .trim()
    .toLowerCase();
  const categories = asArray(query.categoryIds);
  const colors = asArray(query.colors);
  const sizes = asArray(query.sizes);
  const audiences = asArray(query.audiences);
  const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : null;
  const onSale = query.onSale === 'true';
  const inStock = query.inStock === 'true';
  const minRating = query.minRating !== undefined ? Number(query.minRating) : null;

  return state.products.filter((p) => {
    if (term) {
      const haystack =
        `${p.name} ${p.categoryName} ${p.audience} ${p.material} ${p.tags.join(' ')} ${p.shortDescription}`.toLowerCase();
      if (!term.split(/\s+/).every((token) => haystack.includes(token))) return false;
    }
    if (categories.length && !categories.includes(p.categoryId)) return false;
    if (colors.length && !p.colors.some((c) => colors.includes(c))) return false;
    if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
    if (audiences.length && !audiences.includes(p.audience)) return false;
    if (minPrice !== null && !Number.isNaN(minPrice) && p.price < minPrice) return false;
    if (maxPrice !== null && !Number.isNaN(maxPrice) && p.price > maxPrice) return false;
    if (onSale && p.discountPercent <= 0) return false;
    if (inStock && !p.inStock) return false;
    if (minRating !== null && !Number.isNaN(minRating) && p.rating < minRating) return false;
    return true;
  });
}

const SORTERS = {
  relevance: (a, b) => b.rating - a.rating || a.name.localeCompare(b.name),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  discount: (a, b) => b.discountPercent - a.discountPercent,
};

app.get('/api/health', (_req, res) => res.json({ status: 'up', uptime: process.uptime() }));

app.get('/api/config', (_req, res) =>
  res.json({
    appName: 'RIMSS',
    currency: 'INR',
    featureFlags: {
      catalog: true,
      search: true,
      inventory: true,
      cart: true,
      wishlist: true,
      offers: true,
      darkMode: true,
    },
  }),
);

app.get('/api/products', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = clamp(Number(req.query.pageSize) || 12, 1, 60);
  const sort = SORTERS[req.query.sort] ? req.query.sort : 'relevance';

  const filtered = applyFilters(req.query).sort(SORTERS[sort]);
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * pageSize, safePage * pageSize).map(toListItem);

  res.json({ items, page: safePage, pageSize, totalCount, totalPages, sort });
});

app.get('/api/products/featured', (req, res) => {
  const limit = clamp(Number(req.query.limit) || 8, 1, 24);
  const items = state.products
    .filter((p) => p.featured && p.inStock)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit)
    .map(toListItem);
  res.json({ items });
});

app.get('/api/products/suggestions', (req, res) => {
  const term = String(req.query.q || '')
    .trim()
    .toLowerCase();
  if (term.length < 2) return res.json({ items: [] });
  const items = state.products
    .filter((p) => `${p.name} ${p.categoryName} ${p.material}`.toLowerCase().includes(term))
    .slice(0, 8)
    .map((p) => ({ id: p.id, name: p.name, categoryName: p.categoryName, price: p.price }));
  res.json({ items });
});

app.get('/api/products/facets', (req, res) => {
  const matching = applyFilters({ ...req.query, categoryIds: '', colors: '', sizes: '' });
  const countBy = (list, keyFn) =>
    list.reduce((acc, item) => {
      for (const key of [].concat(keyFn(item))) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const categoryCounts = countBy(matching, (p) => p.categoryId);
  const colorCounts = countBy(matching, (p) => p.colors);
  const sizeCounts = countBy(matching, (p) => p.sizes);
  const audienceCounts = countBy(matching, (p) => p.audience);
  const prices = matching.map((p) => p.price);

  res.json({
    categories: CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      count: categoryCounts[c.id] || 0,
    })),
    colors: COLOURS.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      count: colorCounts[c.id] || 0,
    })),
    sizes: Object.keys(sizeCounts)
      .sort()
      .map((s) => ({ id: s, name: s, count: sizeCounts[s] })),
    audiences: Object.keys(audienceCounts).map((a) => ({
      id: a,
      name: a,
      count: audienceCounts[a],
    })),
    priceRange: {
      min: prices.length ? Math.floor(Math.min(...prices)) : 0,
      max: prices.length ? Math.ceil(Math.max(...prices)) : 0,
    },
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = state.products.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!product) {
    return res.status(404).json({ code: 'PRODUCT_NOT_FOUND', message: 'Product does not exist.' });
  }
  const related = state.products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4)
    .map(toListItem);
  res.json({ ...product, related });
});

app.get('/api/offers', (_req, res) => res.json({ items: OFFERS }));

/* ---------------------------------------------------------------------------
 * Inventory (the "sample task" module)
 * ------------------------------------------------------------------------ */

app.get('/api/inventory', (req, res) => {
  const status = String(req.query.status || 'all');
  const term = String(req.query.search || '')
    .trim()
    .toLowerCase();
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = clamp(Number(req.query.pageSize) || 10, 1, 50);

  let rows = state.products.flatMap((p) =>
    p.variants.map((v) => ({
      sku: v.sku,
      productId: p.id,
      productName: p.name,
      categoryName: p.categoryName,
      color: v.colorId,
      size: v.size,
      quantity: v.quantity,
      reorderLevel: v.reorderLevel,
      price: p.price,
      status: v.quantity === 0 ? 'out-of-stock' : v.quantity <= v.reorderLevel ? 'low' : 'healthy',
    })),
  );

  if (status !== 'all') rows = rows.filter((r) => r.status === status);
  if (term) {
    rows = rows.filter((r) =>
      `${r.sku} ${r.productName} ${r.categoryName}`.toLowerCase().includes(term),
    );
  }

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  res.json({
    items: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  });
});

app.get('/api/inventory/summary', (_req, res) => {
  const variants = state.products.flatMap((p) => p.variants);
  const totalUnits = variants.reduce((sum, v) => sum + v.quantity, 0);
  const lowStock = variants.filter((v) => v.quantity > 0 && v.quantity <= v.reorderLevel).length;
  const outOfStock = variants.filter((v) => v.quantity === 0).length;
  const stockValue = state.products.reduce(
    (sum, p) => sum + p.variants.reduce((s, v) => s + v.quantity * p.price, 0),
    0,
  );

  res.json({
    skuCount: variants.length,
    productCount: state.products.length,
    totalUnits,
    lowStock,
    outOfStock,
    stockValue: Math.round(stockValue),
    movements: state.stockMovements.slice(-10).reverse(),
  });
});

app.patch('/api/inventory/:sku', (req, res) => {
  const { sku } = req.params;
  const delta = Number(req.body?.delta);
  const absolute = Number(req.body?.quantity);

  const product = state.products.find((p) => p.variants.some((v) => v.sku === sku));
  if (!product) return res.status(404).json({ code: 'SKU_NOT_FOUND', message: 'Unknown SKU.' });

  const variant = product.variants.find((v) => v.sku === sku);
  const next = Number.isFinite(absolute)
    ? absolute
    : variant.quantity + (Number.isFinite(delta) ? delta : 0);
  if (!Number.isFinite(next) || next < 0 || next > 9999) {
    return res
      .status(400)
      .json({ code: 'INVALID_QUANTITY', message: 'Quantity must be between 0 and 9999.' });
  }

  const previous = variant.quantity;
  variant.quantity = next;
  product.stock = product.variants.reduce((sum, v) => sum + v.quantity, 0);
  product.inStock = product.stock > 0;
  state.stockMovements.push({
    id: randomUUID(),
    sku,
    productName: product.name,
    previous,
    next,
    at: new Date().toISOString(),
  });

  res.json({
    sku,
    productId: product.id,
    productName: product.name,
    categoryName: product.categoryName,
    color: variant.colorId,
    size: variant.size,
    quantity: variant.quantity,
    reorderLevel: variant.reorderLevel,
    price: product.price,
    status:
      variant.quantity === 0
        ? 'out-of-stock'
        : variant.quantity <= variant.reorderLevel
          ? 'low'
          : 'healthy',
  });
});

/* ---------------------------------------------------------------------------
 * Orders
 * ------------------------------------------------------------------------ */

app.get('/api/orders', (_req, res) => res.json({ items: state.orders }));

app.post('/api/orders', (req, res) => {
  const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];
  if (!lines.length) {
    return res
      .status(400)
      .json({ code: 'EMPTY_ORDER', message: 'An order needs at least one line.' });
  }
  const order = {
    id: `ORD-${String(state.orders.length + 1).padStart(5, '0')}`,
    placedAt: new Date().toISOString(),
    status: 'confirmed',
    lines,
    total: lines.reduce((sum, l) => sum + Number(l.price || 0) * Number(l.quantity || 0), 0),
  };
  state.orders.push(order);
  res.status(201).json(order);
});

app.use((req, res) =>
  res.status(404).json({ code: 'NOT_FOUND', message: `No route for ${req.path}` }),
);

app.use((err, _req, res, _next) => {
  console.error('[mock-api] unhandled error', err);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected mock API failure.' });
});

app.listen(PORT, HOST, () => {
  console.log(`[mock-api] RIMSS mock API listening on http://${HOST}:${PORT}/api`);
  console.log(
    `[mock-api] ${state.products.length} products seeded, simulated latency ${LATENCY_MS}ms`,
  );
});
