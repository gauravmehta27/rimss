/**
 * Deterministic catalogue generator for the RIMMS mock API.
 * Produces a stable data set so UI snapshots and manual QA stay reproducible.
 */

const CATEGORIES = [
  { id: 'sweaters', name: 'Sweaters', department: 'Clothing' },
  { id: 'moleskin', name: 'Moleskin', department: 'Clothing' },
  { id: 'corduroy', name: 'Corduroy', department: 'Clothing' },
  { id: 'shirts', name: 'Tattersall Shirts', department: 'Clothing' },
  { id: 'outerwear', name: 'Outerwear', department: 'Clothing' },
  { id: 'shoes', name: 'Shoes', department: 'Footwear' },
  { id: 'accessories', name: 'Accessories', department: 'Accessories' },
];

const AUDIENCES = ['Men', 'Women', 'Children'];

const MATERIALS = [
  'Merino Wool',
  'Lambswool',
  'Cotton Moleskin',
  'Needlecord Corduroy',
  'Brushed Cotton',
  'Cashmere Blend',
  'Waxed Cotton',
  'Full-grain Leather',
];

const COLOURS = [
  { id: 'oatmeal', name: 'Oatmeal', hex: '#d8cbb4' },
  { id: 'forest', name: 'Forest', hex: '#2f4f3a' },
  { id: 'burgundy', name: 'Burgundy', hex: '#6b1f2b' },
  { id: 'navy', name: 'Navy', hex: '#1f2d4d' },
  { id: 'camel', name: 'Camel', hex: '#b58a54' },
  { id: 'charcoal', name: 'Charcoal', hex: '#3a3d42' },
  { id: 'sage', name: 'Sage', hex: '#8a9a7b' },
  { id: 'ecru', name: 'Ecru', hex: '#f0e7d8' },
];

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['UK6', 'UK7', 'UK8', 'UK9', 'UK10', 'UK11'];
const ONE_SIZE = ['One Size'];

const NAME_PREFIX = [
  'Ashcombe',
  'Bramley',
  'Caldwell',
  'Denbury',
  'Elmswood',
  'Fenwick',
  'Grayling',
  'Harewood',
  'Inglestone',
  'Kelmscott',
  'Larkspur',
  'Marlow',
];

const NAME_SUFFIX = {
  sweaters: ['Cable Knit Jumper', 'Shawl Collar Cardigan', 'Ribbed Crew Neck', 'Lambswool V-Neck'],
  moleskin: ['Moleskin Trousers', 'Moleskin Overshirt', 'Moleskin Blazer', 'Moleskin Waistcoat'],
  corduroy: ['Needlecord Trousers', 'Corduroy Chore Jacket', 'Corduroy Skirt', 'Jumbo Cord Shirt'],
  shirts: [
    'Tattersall Shirt',
    'Brushed Check Shirt',
    'Country Twill Shirt',
    'Heritage Oxford Shirt',
  ],
  outerwear: ['Waxed Field Jacket', 'Quilted Gilet', 'Tweed Overcoat', 'Shearling Parka'],
  shoes: ['Leather Chelsea Boot', 'Country Brogue', 'Suede Derby', 'Hand-stitched Loafer'],
  accessories: ['Lambswool Scarf', 'Leather Belt', 'Wool Flat Cap', 'Tartan Gloves'],
};

/** Small deterministic PRNG (mulberry32) so the data set never shifts between runs. */
function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];

function sizesFor(categoryId) {
  if (categoryId === 'shoes') return SHOE_SIZES;
  if (categoryId === 'accessories') return ONE_SIZE;
  return CLOTHING_SIZES;
}

function buildProducts(count = 132) {
  const rnd = createRandom(20260901);
  const products = [];

  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const audience = AUDIENCES[Math.floor(rnd() * AUDIENCES.length)];
    const suffix = pick(rnd, NAME_SUFFIX[category.id]);
    const prefix = NAME_PREFIX[(i * 7) % NAME_PREFIX.length];
    const name = `${prefix} ${suffix}`;

    // Rupee ladder: ~₹5,000 to ~₹50,000, rounded to a retail-friendly x99.
    const basePrice = Math.round((5000 + rnd() * 45000) / 100) * 100 + 99;
    const discountPercent = rnd() > 0.68 ? [10, 15, 20, 25, 30, 40][Math.floor(rnd() * 6)] : 0;
    const price = discountPercent
      ? Math.round(basePrice * (1 - discountPercent / 100))
      : basePrice;

    const colours = [...COLOURS]
      .sort(() => rnd() - 0.5)
      .slice(0, 2 + Math.floor(rnd() * 3))
      .map((c) => c.id);

    const sizes = sizesFor(category.id);
    const variants = [];
    colours.forEach((colourId) => {
      sizes.forEach((size) => {
        const quantity = Math.floor(rnd() * 26);
        variants.push({
          sku: `${category.id.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}-${colourId
            .slice(0, 3)
            .toUpperCase()}-${size}`,
          colorId: colourId,
          size,
          quantity,
          reorderLevel: 6,
        });
      });
    });

    const stock = variants.reduce((sum, v) => sum + v.quantity, 0);
    const rating = Math.round((3.2 + rnd() * 1.8) * 10) / 10;

    products.push({
      id: `p-${String(i + 1).padStart(4, '0')}`,
      slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`,
      name,
      brand: 'YCompany',
      categoryId: category.id,
      categoryName: category.name,
      department: category.department,
      audience,
      material: pick(rnd, MATERIALS),
      description:
        `${name} crafted in ${pick(rnd, MATERIALS).toLowerCase()} for the modern countryside wardrobe. ` +
        'Finished with reinforced seams, natural horn buttons and a relaxed heritage cut that layers effortlessly.',
      shortDescription: `${category.name} · ${audience} · ${colours.length} colourways`,
      price,
      listPrice: basePrice,
      discountPercent,
      currency: 'INR',
      rating,
      reviewCount: 8 + Math.floor(rnd() * 420),
      colors: colours,
      sizes,
      variants,
      stock,
      inStock: stock > 0,
      featured: rnd() > 0.82,
      isNew: rnd() > 0.85,
      tags: [category.name, audience, discountPercent ? 'On Sale' : 'Core Range'],
      imageSeed: (i % 24) + 1,
      createdAt: new Date(Date.UTC(2025, i % 12, ((i * 3) % 27) + 1)).toISOString(),
    });
  }

  return products;
}

const PRODUCTS = buildProducts();

const OFFERS = [
  {
    id: 'offer-aw-drop',
    title: 'Autumn/Winter Drop',
    subtitle: 'Up to 30% off heritage knitwear',
    code: 'AW30',
    discountPercent: 30,
    categoryId: 'sweaters',
    accent: 'primary',
    validTill: '2026-11-30',
  },
  {
    id: 'offer-country',
    title: 'Countryside Edit',
    subtitle: 'Moleskin & corduroy essentials from ₹7,999',
    code: 'COUNTRY99',
    discountPercent: 20,
    categoryId: 'moleskin',
    accent: 'success',
    validTill: '2026-10-15',
  },
  {
    id: 'offer-shoes',
    title: 'Hand-finished Footwear',
    subtitle: 'Complimentary shoe care kit on every pair',
    code: 'STEPUP',
    discountPercent: 10,
    categoryId: 'shoes',
    accent: 'warning',
    validTill: '2026-12-24',
  },
];

module.exports = { PRODUCTS, OFFERS, CATEGORIES, COLOURS, AUDIENCES, MATERIALS };
