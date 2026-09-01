const PALETTES: readonly (readonly [string, string])[] = [
  ['#2f4f3a', '#8a9a7b'],
  ['#6b1f2b', '#c98a92'],
  ['#1f2d4d', '#7f92bd'],
  ['#b58a54', '#f0e7d8'],
  ['#3a3d42', '#9aa0a8'],
  ['#4a3728', '#c4a484'],
];

/** Unsplash photo ids grouped by catalogue category. */
const PHOTOS: Record<string, readonly string[]> = {
  sweaters: [
    'photo-1434389677669-e08b4cac3105',
    'photo-1620799140408-edc6dcb6d633',
    'photo-1523381210434-271e8be1f52b',
    'photo-1556905055-8f358a7a47b2',
  ],
  moleskin: [
    'photo-1594633312681-425c7b97ccd1',
    'photo-1544441893-675973e31985',
    'photo-1490481651871-ab68de25d43d',
    'photo-1576871337622-98d48d1cf531',
  ],
  corduroy: [
    'photo-1611312449408-fcece27cdbb7',
    'photo-1591047139829-d91aecb6caea',
    'photo-1445205170230-053b83016050',
    'photo-1490481651871-ab68de25d43d',
  ],
  shirts: [
    'photo-1596755094514-f87e34085b2c',
    'photo-1489987707025-afc232f7ea0f',
    'photo-1521572163474-6864f9cf17ab',
    'photo-1618354691373-d851c5c3a990',
  ],
  outerwear: [
    'photo-1551028719-00167b16eac5',
    'photo-1483985988355-763728e1935b',
    'photo-1441984904996-e0b6ba687e04',
    'photo-1591047139829-d91aecb6caea',
  ],
  shoes: [
    'photo-1520639888713-7851133b1ed0',
    'photo-1608256246200-53e635b5b65f',
    'photo-1549298916-b41d501d3772',
    'photo-1479064555552-3ef4979f8908',
  ],
  accessories: [
    'photo-1479064555552-3ef4979f8908',
    'photo-1553062407-98eeb64c6a62',
    'photo-1571945153237-4929e783af4a',
    'photo-1556905055-8f358a7a47b2',
  ],
};

const FALLBACK_PHOTOS: readonly string[] = [
  'photo-1434389677669-e08b4cac3105',
  'photo-1596755094514-f87e34085b2c',
  'photo-1551028719-00167b16eac5',
  'photo-1520639888713-7851133b1ed0',
  'photo-1479064555552-3ef4979f8908',
  'photo-1594633312681-425c7b97ccd1',
];

/**
 * Real product photography for a tile, picked deterministically from the
 * category pool so a product always renders the same shot.
 */
export function productImage(seed: number, categoryId = '', width = 400, height = 300): string {
  const pool = PHOTOS[categoryId] ?? FALLBACK_PHOTOS;
  const photo = pool[Math.abs(seed) % pool.length];
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&h=${height}&q=70`;
}

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();

/**
 * Deterministic inline SVG placeholder rendered behind the photo, so a slow or
 * failed image request never leaves an empty tile.
 */
export function productArtwork(seed: number, name: string, label = ''): string {
  const [from, to] = PALETTES[Math.abs(seed) % PALETTES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
</linearGradient></defs>
<rect width="400" height="300" fill="url(#g)"/>
<circle cx="330" cy="60" r="90" fill="#ffffff" opacity="0.08"/>
<circle cx="60" cy="255" r="70" fill="#000000" opacity="0.10"/>
<text x="32" y="170" font-family="Georgia, serif" font-size="76" fill="#ffffff" opacity="0.92">${escapeXml(initials(name))}</text>
<text x="34" y="205" font-family="Helvetica, Arial, sans-serif" font-size="17" letter-spacing="3" fill="#ffffff" opacity="0.75">${escapeXml(label.toUpperCase())}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n/g, ''))}`;
}
