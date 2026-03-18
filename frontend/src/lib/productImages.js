import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/placeholder';

const extractImageUrl = (item) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    return item.url || item.src || item.image || item.link || null;
  }
  return null;
};

export function normalizeImageList(value) {
  if (!value) return [];

  // Already an array (most common)
  if (Array.isArray(value)) {
    return value.map(extractImageUrl).filter(Boolean);
  }

  // String can be:
  // - comma-separated URLs: "url1,url2"
  // - JSON array string: "[\"url1\",\"url2\"]"
  // - single URL: "url1"
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];

    // Try JSON first
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.map(extractImageUrl).filter(Boolean);
        }
        const one = extractImageUrl(parsed);
        return one ? [one] : [];
      } catch (_) {
        // Fall through to comma split
      }
    }

    // Comma-separated fallback
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

export function getProductImageList(product) {
  const imagesFromImages = normalizeImageList(product?.images);
  const imagesFromImage = normalizeImageList(product?.image);

  const combined = [...imagesFromImages, ...imagesFromImage].filter(Boolean);
  const deduped = Array.from(new Set(combined));

  return deduped.length > 0 ? deduped : [PLACEHOLDER_PRODUCT_IMAGE];
}

export function getFirstProductImage(product) {
  return getProductImageList(product)[0] || PLACEHOLDER_PRODUCT_IMAGE;
}

