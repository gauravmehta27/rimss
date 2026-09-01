export type ProductSort = 'relevance' | 'priceAsc' | 'priceDesc' | 'rating' | 'newest' | 'discount';

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  categoryName: string;
  department: string;
  audience: string;
  material: string;
  shortDescription: string;
  price: number;
  listPrice: number;
  discountPercent: number;
  currency: string;
  rating: number;
  reviewCount: number;
  colors: string[];
  sizes: string[];
  stock: number;
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  tags: string[];
  imageSeed: number;
  createdAt: string;
}

export interface ProductVariant {
  sku: string;
  colorId: string;
  size: string;
  quantity: number;
  reorderLevel: number;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  variants: ProductVariant[];
  related: ProductSummary[];
}

export interface ProductQuery {
  search?: string;
  categoryIds?: string[];
  colors?: string[];
  sizes?: string[];
  audiences?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  onSale?: boolean;
  inStock?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface FacetValue {
  id: string;
  name: string;
  count: number;
  hex?: string;
}

export interface ProductFacets {
  categories: FacetValue[];
  colors: FacetValue[];
  sizes: FacetValue[];
  audiences: FacetValue[];
  priceRange: { min: number; max: number };
}

export interface Suggestion {
  id: string;
  name: string;
  categoryName: string;
  price: number;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  discountPercent: number;
  categoryId: string;
  accent: string;
  validTill: string;
}

export const EMPTY_PRODUCT_QUERY: Required<
  Pick<ProductQuery, 'search' | 'categoryIds' | 'colors' | 'sizes' | 'audiences' | 'sort' | 'page'>
> = {
  search: '',
  categoryIds: [],
  colors: [],
  sizes: [],
  audiences: [],
  sort: 'relevance',
  page: 1,
};
