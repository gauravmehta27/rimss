const PRODUCT_SUMMARY_FRAGMENT = `
  fragment ProductSummary on Product {
    id
    slug
    name
    brand
    categoryId
    categoryName
    department
    audience
    material
    shortDescription
    price
    listPrice
    discountPercent
    currency
    rating
    reviewCount
    colors
    sizes
    stock
    inStock
    featured
    isNew
    tags
    imageSeed
    createdAt
  }
`;

export const CATALOG_PAGE_QUERY = `
  query CatalogPage($filter: ProductFilterInput, $sort: ProductSort, $page: Int, $pageSize: Int) {
    products(filter: $filter, sort: $sort, page: $page, pageSize: $pageSize) {
      items { ...ProductSummary }
      page
      pageSize
      totalCount
      totalPages
      sort
    }
    productFacets(filter: $filter) {
      categories { id name count }
      colors { id name count hex }
      sizes { id name count }
      audiences { id name count }
      priceRange { min max }
    }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const FEATURED_PRODUCTS_QUERY = `
  query FeaturedProducts($limit: Int) {
    featuredProducts(limit: $limit) { ...ProductSummary }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const PRODUCT_DETAIL_QUERY = `
  query ProductDetail($id: ID!) {
    product(id: $id) {
      ...ProductSummary
      description
      variants { sku colorId size quantity reorderLevel }
      related { ...ProductSummary }
    }
  }
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const PRODUCT_SUGGESTIONS_QUERY = `
  query ProductSuggestions($term: String!) {
    productSuggestions(term: $term) { id name categoryName price }
  }
`;

export const OFFERS_QUERY = `
  query Offers {
    offers { id title subtitle code discountPercent categoryId accent validTill }
  }
`;

const INVENTORY_ROW_FRAGMENT = `
  fragment InventoryRow on InventoryRow {
    sku
    productId
    productName
    categoryName
    color
    size
    quantity
    reorderLevel
    price
    status
  }
`;

export const INVENTORY_PAGE_QUERY = `
  query InventoryPage($search: String, $status: String, $page: Int, $pageSize: Int) {
    inventory(search: $search, status: $status, page: $page, pageSize: $pageSize) {
      items { ...InventoryRow }
      page
      pageSize
      totalCount
      totalPages
    }
  }
  ${INVENTORY_ROW_FRAGMENT}
`;

export const INVENTORY_SUMMARY_QUERY = `
  query InventorySummary {
    inventorySummary {
      skuCount
      productCount
      totalUnits
      lowStock
      outOfStock
      stockValue
      movements { id sku productName previous next at }
    }
  }
`;

export const ADJUST_STOCK_MUTATION = `
  mutation AdjustStock($sku: ID!, $delta: Int!) {
    adjustStock(sku: $sku, delta: $delta) { ...InventoryRow }
  }
  ${INVENTORY_ROW_FRAGMENT}
`;

export const SET_STOCK_QUANTITY_MUTATION = `
  mutation SetStockQuantity($sku: ID!, $quantity: Int!) {
    setStockQuantity(sku: $sku, quantity: $quantity) { ...InventoryRow }
  }
  ${INVENTORY_ROW_FRAGMENT}
`;

const ORDER_FRAGMENT = `
  fragment OrderFields on Order {
    id
    placedAt
    status
    total
    lines { sku name price quantity }
  }
`;

export const ORDERS_QUERY = `
  query Orders {
    orders { ...OrderFields }
  }
  ${ORDER_FRAGMENT}
`;

export const PLACE_ORDER_MUTATION = `
  mutation PlaceOrder($lines: [OrderLineInput!]!) {
    placeOrder(lines: $lines) { ...OrderFields }
  }
  ${ORDER_FRAGMENT}
`;
