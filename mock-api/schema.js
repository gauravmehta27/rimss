/**
 * RIMMS GraphQL schema.
 *
 * Single source of truth for the mock backend contract. The Angular client
 * talks to one endpoint (`POST /api/products`) and selects exactly the fields it
 * needs, so list views stay lean while the detail view asks for variants and
 * related products in the same round trip.
 *
 * Dev-only: no authentication, in-memory state, resets on restart.
 */

const { buildSchema, GraphQLError } = require('graphql');
const { randomUUID } = require('node:crypto');
const { PRODUCTS, OFFERS, CATEGORIES, COLOURS } = require('./data/catalogue');

const typeDefs = /* GraphQL */ `
  enum ProductSort {
    relevance
    priceAsc
    priceDesc
    rating
    newest
    discount
  }

  input ProductFilterInput {
    search: String
    categoryIds: [ID!]
    colors: [ID!]
    sizes: [String!]
    audiences: [String!]
    minPrice: Float
    maxPrice: Float
    minRating: Float
    onSale: Boolean
    inStock: Boolean
  }

  input OrderLineInput {
    sku: ID!
    name: String!
    price: Float!
    quantity: Int!
  }

  type ProductVariant {
    sku: ID!
    colorId: String!
    size: String!
    quantity: Int!
    reorderLevel: Int!
  }

  type Product {
    id: ID!
    slug: String!
    name: String!
    brand: String!
    categoryId: ID!
    categoryName: String!
    department: String!
    audience: String!
    material: String!
    shortDescription: String!
    description: String!
    price: Float!
    listPrice: Float!
    discountPercent: Int!
    currency: String!
    rating: Float!
    reviewCount: Int!
    colors: [String!]!
    sizes: [String!]!
    stock: Int!
    inStock: Boolean!
    featured: Boolean!
    isNew: Boolean!
    tags: [String!]!
    imageSeed: Int!
    createdAt: String!
    variants: [ProductVariant!]!
    related(limit: Int = 4): [Product!]!
  }

  type ProductPage {
    items: [Product!]!
    page: Int!
    pageSize: Int!
    totalCount: Int!
    totalPages: Int!
    sort: String!
  }

  type FacetValue {
    id: ID!
    name: String!
    count: Int!
    hex: String
  }

  type PriceRange {
    min: Float!
    max: Float!
  }

  type ProductFacets {
    categories: [FacetValue!]!
    colors: [FacetValue!]!
    sizes: [FacetValue!]!
    audiences: [FacetValue!]!
    priceRange: PriceRange!
  }

  type Suggestion {
    id: ID!
    name: String!
    categoryName: String!
    price: Float!
  }

  type Offer {
    id: ID!
    title: String!
    subtitle: String!
    code: String!
    discountPercent: Int!
    categoryId: ID!
    accent: String!
    validTill: String!
  }

  type InventoryRow {
    sku: ID!
    productId: ID!
    productName: String!
    categoryName: String!
    color: String!
    size: String!
    quantity: Int!
    reorderLevel: Int!
    price: Float!
    status: String!
  }

  type InventoryPage {
    items: [InventoryRow!]!
    page: Int!
    pageSize: Int!
    totalCount: Int!
    totalPages: Int!
  }

  type StockMovement {
    id: ID!
    sku: ID!
    productName: String!
    previous: Int!
    next: Int!
    at: String!
  }

  type InventorySummary {
    skuCount: Int!
    productCount: Int!
    totalUnits: Int!
    lowStock: Int!
    outOfStock: Int!
    stockValue: Int!
    movements: [StockMovement!]!
  }

  type OrderLine {
    sku: ID!
    name: String!
    price: Float!
    quantity: Int!
  }

  type Order {
    id: ID!
    placedAt: String!
    status: String!
    lines: [OrderLine!]!
    total: Float!
  }

  type FeatureFlags {
    catalog: Boolean!
    search: Boolean!
    inventory: Boolean!
    cart: Boolean!
    wishlist: Boolean!
    offers: Boolean!
    darkMode: Boolean!
  }

  type AppConfiguration {
    appName: String!
    currency: String!
    featureFlags: FeatureFlags!
  }

  type Health {
    status: String!
    uptime: Float!
  }

  type Query {
    health: Health!
    config: AppConfiguration!
    products(
      filter: ProductFilterInput
      sort: ProductSort = relevance
      page: Int = 1
      pageSize: Int = 12
    ): ProductPage!
    """
    Counts ignore the category/colour/size selections in \`filter\` so the
    facet list stays usable while those facets are being narrowed down.
    """
    productFacets(filter: ProductFilterInput): ProductFacets!
    featuredProducts(limit: Int = 8): [Product!]!
    productSuggestions(term: String!): [Suggestion!]!
    product(id: ID!): Product
    offers: [Offer!]!
    inventory(
      search: String
      status: String = "all"
      page: Int = 1
      pageSize: Int = 10
    ): InventoryPage!
    inventorySummary: InventorySummary!
    orders: [Order!]!
  }

  type Mutation {
    adjustStock(sku: ID!, delta: Int!): InventoryRow!
    setStockQuantity(sku: ID!, quantity: Int!): InventoryRow!
    placeOrder(lines: [OrderLineInput!]!): Order!
  }
`;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const isSet = (value) => value !== undefined && value !== null;

/** Fresh in-memory state; the seed data is cloned so restarts are reproducible. */
function createState() {
  return {
    products: PRODUCTS.map((p) => ({ ...p, variants: p.variants.map((v) => ({ ...v })) })),
    orders: [],
    stockMovements: [],
  };
}

function applyFilters(products, filter = {}) {
  const term = String(filter.search || '')
    .trim()
    .toLowerCase();
  const categories = filter.categoryIds ?? [];
  const colors = filter.colors ?? [];
  const sizes = filter.sizes ?? [];
  const audiences = filter.audiences ?? [];

  return products.filter((p) => {
    if (term) {
      const haystack =
        `${p.name} ${p.categoryName} ${p.audience} ${p.material} ${p.tags.join(' ')} ${p.shortDescription}`.toLowerCase();
      if (!term.split(/\s+/).every((token) => haystack.includes(token))) return false;
    }
    if (categories.length && !categories.includes(p.categoryId)) return false;
    if (colors.length && !p.colors.some((c) => colors.includes(c))) return false;
    if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
    if (audiences.length && !audiences.includes(p.audience)) return false;
    if (isSet(filter.minPrice) && p.price < filter.minPrice) return false;
    if (isSet(filter.maxPrice) && p.price > filter.maxPrice) return false;
    if (isSet(filter.minRating) && p.rating < filter.minRating) return false;
    if (filter.onSale && p.discountPercent <= 0) return false;
    if (filter.inStock && !p.inStock) return false;
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

const stockStatus = (variant) =>
  variant.quantity === 0
    ? 'out-of-stock'
    : variant.quantity <= variant.reorderLevel
      ? 'low'
      : 'healthy';

const toInventoryRow = (product, variant) => ({
  sku: variant.sku,
  productId: product.id,
  productName: product.name,
  categoryName: product.categoryName,
  color: variant.colorId,
  size: variant.size,
  quantity: variant.quantity,
  reorderLevel: variant.reorderLevel,
  price: product.price,
  status: stockStatus(variant),
});

const countBy = (list, keyFn) =>
  list.reduce((acc, item) => {
    for (const key of [].concat(keyFn(item))) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const fail = (code, message) => {
  throw new GraphQLError(message, { extensions: { code } });
};

function paginate(items, page, pageSize) {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
}

function updateStock(state, sku, next) {
  const product = state.products.find((p) => p.variants.some((v) => v.sku === sku));
  if (!product) fail('SKU_NOT_FOUND', 'Unknown SKU.');

  const variant = product.variants.find((v) => v.sku === sku);
  if (!Number.isFinite(next) || next < 0 || next > 9999) {
    fail('INVALID_QUANTITY', 'Quantity must be between 0 and 9999.');
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

  return toInventoryRow(product, variant);
}

/** Root resolvers. With `buildSchema` these receive `(args, context, info)`. */
function createRootValue(state) {
  return {
    health: () => ({ status: 'up', uptime: process.uptime() }),

    config: () => ({
      appName: 'RIMMS',
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

    products: ({ filter, sort, page, pageSize }) => {
      const key = SORTERS[sort] ? sort : 'relevance';
      const matching = applyFilters(state.products, filter).sort(SORTERS[key]);
      return { ...paginate(matching, page, clamp(pageSize, 1, 60)), sort: key };
    },

    productFacets: ({ filter }) => {
      const matching = applyFilters(state.products, {
        ...filter,
        categoryIds: [],
        colors: [],
        sizes: [],
      });

      const categoryCounts = countBy(matching, (p) => p.categoryId);
      const colorCounts = countBy(matching, (p) => p.colors);
      const sizeCounts = countBy(matching, (p) => p.sizes);
      const audienceCounts = countBy(matching, (p) => p.audience);
      const prices = matching.map((p) => p.price);

      return {
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
      };
    },

    featuredProducts: ({ limit }) =>
      state.products
        .filter((p) => p.featured && p.inStock)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, clamp(limit, 1, 24)),

    productSuggestions: ({ term }) => {
      const needle = String(term || '')
        .trim()
        .toLowerCase();
      if (needle.length < 2) return [];
      return state.products
        .filter((p) => `${p.name} ${p.categoryName} ${p.material}`.toLowerCase().includes(needle))
        .slice(0, 8)
        .map((p) => ({ id: p.id, name: p.name, categoryName: p.categoryName, price: p.price }));
    },

    product: ({ id }) => {
      const product = state.products.find((p) => p.id === id || p.slug === id);
      if (!product) fail('PRODUCT_NOT_FOUND', 'Product does not exist.');
      return product;
    },

    offers: () => OFFERS,

    inventory: ({ search, status, page, pageSize }) => {
      const term = String(search || '')
        .trim()
        .toLowerCase();

      let rows = state.products.flatMap((p) => p.variants.map((v) => toInventoryRow(p, v)));
      if (status && status !== 'all') rows = rows.filter((r) => r.status === status);
      if (term) {
        rows = rows.filter((r) =>
          `${r.sku} ${r.productName} ${r.categoryName}`.toLowerCase().includes(term),
        );
      }

      return paginate(rows, page, clamp(pageSize, 1, 50));
    },

    inventorySummary: () => {
      const variants = state.products.flatMap((p) => p.variants);
      const stockValue = state.products.reduce(
        (sum, p) => sum + p.variants.reduce((s, v) => s + v.quantity * p.price, 0),
        0,
      );

      return {
        skuCount: variants.length,
        productCount: state.products.length,
        totalUnits: variants.reduce((sum, v) => sum + v.quantity, 0),
        lowStock: variants.filter((v) => v.quantity > 0 && v.quantity <= v.reorderLevel).length,
        outOfStock: variants.filter((v) => v.quantity === 0).length,
        stockValue: Math.round(stockValue),
        movements: state.stockMovements.slice(-10).reverse(),
      };
    },

    orders: () => state.orders,

    adjustStock: ({ sku, delta }) => {
      const product = state.products.find((p) => p.variants.some((v) => v.sku === sku));
      if (!product) fail('SKU_NOT_FOUND', 'Unknown SKU.');
      const variant = product.variants.find((v) => v.sku === sku);
      return updateStock(state, sku, variant.quantity + delta);
    },

    setStockQuantity: ({ sku, quantity }) => updateStock(state, sku, quantity),

    placeOrder: ({ lines }) => {
      if (!lines.length) fail('EMPTY_ORDER', 'An order needs at least one line.');
      const order = {
        id: `ORD-${String(state.orders.length + 1).padStart(5, '0')}`,
        placedAt: new Date().toISOString(),
        status: 'confirmed',
        lines,
        total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      };
      state.orders.push(order);
      return order;
    },
  };
}

function createSchema(state) {
  const schema = buildSchema(typeDefs);
  // `related` is the one field that needs its parent, which root-value resolvers
  // cannot supply, so it is attached directly to the type.
  schema.getType('Product').getFields().related.resolve = (product, { limit }) =>
    state.products
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, clamp(limit ?? 4, 1, 12));
  return schema;
}

module.exports = { typeDefs, createState, createSchema, createRootValue };
