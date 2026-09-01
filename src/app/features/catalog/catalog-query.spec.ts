import { describe, expect, it } from 'vitest';
import { activeFilterCount, parseProductQuery, toQueryParams, toggleFacet } from './catalog-query';

describe('parseProductQuery', () => {
  it('falls back to safe defaults for an empty URL', () => {
    const query = parseProductQuery({}, 12);

    expect(query).toEqual({
      search: '',
      categoryIds: [],
      colors: [],
      sizes: [],
      audiences: [],
      minPrice: null,
      maxPrice: null,
      minRating: null,
      onSale: false,
      inStock: false,
      sort: 'relevance',
      page: 1,
      pageSize: 12,
    });
  });

  it('expands comma separated facets and coerces numeric params', () => {
    const query = parseProductQuery(
      {
        search: 'corduroy',
        categories: 'corduroy,shirts',
        colors: 'navy',
        minPrice: '120',
        page: '4',
      },
      12,
    );

    expect(query.search).toBe('corduroy');
    expect(query.categoryIds).toEqual(['corduroy', 'shirts']);
    expect(query.colors).toEqual(['navy']);
    expect(query.minPrice).toBe(120);
    expect(query.page).toBe(4);
  });

  it('rejects an unknown sort value rather than forwarding it to the API', () => {
    expect(parseProductQuery({ sort: 'DROP TABLE products' }, 12).sort).toBe('relevance');
  });

  it('clamps an invalid page number', () => {
    expect(parseProductQuery({ page: '-2' }, 12).page).toBe(1);
    expect(parseProductQuery({ page: 'abc' }, 12).page).toBe(1);
  });
});

describe('toQueryParams', () => {
  it('round-trips a query without leaking default values into the URL', () => {
    const params = toQueryParams(parseProductQuery({}, 12));

    expect(Object.values(params).every((value) => value === null)).toBe(true);
  });

  it('keeps a query stable across parse → serialise → parse', () => {
    const source = {
      search: 'tattersall',
      categories: 'shirts',
      sort: 'priceDesc',
      page: '2',
      onSale: 'true',
    };
    const params = toQueryParams(parseProductQuery(source, 12));

    expect(params).toMatchObject({
      search: 'tattersall',
      categories: 'shirts',
      sort: 'priceDesc',
      page: 2,
      onSale: 'true',
    });
  });
});

describe('toggleFacet', () => {
  it('adds a value that is not selected', () => {
    expect(toggleFacet(['navy'], 'forest')).toEqual(['navy', 'forest']);
  });

  it('removes a value that is already selected', () => {
    expect(toggleFacet(['navy', 'forest'], 'navy')).toEqual(['forest']);
  });

  it('treats an undefined selection as empty', () => {
    expect(toggleFacet(undefined, 'navy')).toEqual(['navy']);
  });
});

describe('activeFilterCount', () => {
  it('counts every applied refinement', () => {
    const count = activeFilterCount({
      categoryIds: ['sweaters', 'shirts'],
      colors: ['navy'],
      minPrice: 100,
      onSale: true,
    });

    expect(count).toBe(5);
  });

  it('is zero when only a search term is present', () => {
    expect(activeFilterCount({ search: 'wool' })).toBe(0);
  });
});
