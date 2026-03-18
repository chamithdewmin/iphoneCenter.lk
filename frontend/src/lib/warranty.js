export const PRODUCT_TYPES = {
  NORMAL: 'NORMAL',
  PHONE: 'PHONE',
  SERVICE: 'SERVICE',
};

export const WARRANTY_MODES = {
  NONE: 'NONE',
  SIMPLE: 'SIMPLE',
  STANDARD: 'STANDARD',
  COMPLEX: 'COMPLEX',
};

export const WARRANTY_ITEM_TYPES = {
  PHONE_TO_PHONE: 'phone_to_phone',
  SOFTWARE: 'software',
  SERVICE: 'service',
};

export const SIMPLE_WARRANTY_DURATIONS = [
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
];

export const DURATION_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
];

// Map existing product data (from backend) into a richer warranty shape
export function decodeWarrantyFromLegacy(product) {
  const rawType = (product?.warranty_type || '').trim();
  const rawMonths = product?.warranty_months;

  // Explicit "complex:" format
  if (rawType.startsWith('complex:')) {
    const parts = rawType.replace(/^complex:/, '').split(',').map((p) => p.trim()).filter(Boolean);
    const complex_items = parts.map((p) => {
      const [key, val] = p.split('=');
      if (!key || !val) return null;
      const match = String(val).match(/^(\d+)([dm])$/i);
      if (!match) {
        return null;
      }
      const duration = Number(match[1]) || 0;
      const unit = match[2].toLowerCase() === 'd' ? 'days' : 'months';
      return {
        type: key,
        duration,
        duration_unit: unit,
      };
    }).filter(Boolean);
    return {
      warranty_mode: WARRANTY_MODES.COMPLEX,
      simple_duration_months: null,
      warranty_profile_id: null,
      complex_items,
    };
  }

  // Standard profile format: "standard:Profile Name"
  if (rawType.startsWith('standard:')) {
    const profileName = rawType.replace(/^standard:/, '').trim() || null;
    return {
      warranty_mode: WARRANTY_MODES.STANDARD,
      simple_duration_months: null,
      warranty_profile_id: profileName,
      complex_items: [],
    };
  }

  // Legacy comma-separated types without durations -> treat as complex with default 30 days
  if (rawType && !rawType.includes(':')) {
    const types = rawType.split(',').map((t) => t.trim()).filter(Boolean);
    if (types.length > 0) {
      const complex_items = types.map((t) => ({
        type: t,
        duration: 30,
        duration_unit: 'days',
      }));
      return {
        warranty_mode: WARRANTY_MODES.COMPLEX,
        simple_duration_months: null,
        warranty_profile_id: null,
        complex_items,
      };
    }
  }

  // Simple or none
  if (rawMonths && Number(rawMonths) > 0) {
    return {
      warranty_mode: WARRANTY_MODES.SIMPLE,
      simple_duration_months: Number(rawMonths),
      warranty_profile_id: null,
      complex_items: [],
    };
  }

  return {
    warranty_mode: WARRANTY_MODES.NONE,
    simple_duration_months: null,
    warranty_profile_id: null,
    complex_items: [],
  };
}

// Encode the rich warranty shape back into legacy fields that the current API understands
export function encodeWarrantyToLegacy(shape) {
  if (!shape || !shape.warranty_mode || shape.warranty_mode === WARRANTY_MODES.NONE) {
    return {
      warranty_type: null,
      warranty_months: null,
    };
  }

  if (shape.warranty_mode === WARRANTY_MODES.SIMPLE) {
    const months = Number(shape.simple_duration_months) || null;
    return {
      warranty_type: months ? 'simple' : null,
      warranty_months: months,
    };
  }

  if (shape.warranty_mode === WARRANTY_MODES.STANDARD) {
    const profileId = shape.warranty_profile_id || null;
    return {
      warranty_type: profileId ? `standard:${profileId}` : null,
      warranty_months: null,
    };
  }

  if (shape.warranty_mode === WARRANTY_MODES.COMPLEX) {
    const items = Array.isArray(shape.complex_items) ? shape.complex_items : [];
    if (!items.length) {
      return {
        warranty_type: null,
        warranty_months: null,
      };
    }
    const encoded = items
      .filter((i) => i && i.type && i.duration > 0)
      .map((i) => {
        const suffix = i.duration_unit === 'days' ? 'd' : 'm';
        return `${i.type}=${i.duration}${suffix}`;
      });
    if (!encoded.length) {
      return {
        warranty_type: null,
        warranty_months: null,
      };
    }
    return {
      warranty_type: `complex:${encoded.join(',')}`,
      warranty_months: null,
    };
  }

  return {
    warranty_type: null,
    warranty_months: null,
  };
}

// Business rules for default warranty, based on product "type" and condition
export function getDefaultWarrantyForProduct(productType, condition) {
  if (productType === PRODUCT_TYPES.PHONE) {
    if (condition === 'new') {
      return {
        warranty_mode: WARRANTY_MODES.SIMPLE,
        simple_duration_months: 12,
      };
    }
    if (condition === 'used' || condition === 'refurbished') {
      return {
        warranty_mode: WARRANTY_MODES.SIMPLE,
        simple_duration_months: 3,
      };
    }
  }

  if (productType === PRODUCT_TYPES.NORMAL) {
    return {
      warranty_mode: WARRANTY_MODES.NONE,
      simple_duration_months: null,
    };
  }

  if (productType === PRODUCT_TYPES.SERVICE) {
    return {
      warranty_mode: WARRANTY_MODES.NONE,
      simple_duration_months: null,
    };
  }

  return {
    warranty_mode: WARRANTY_MODES.NONE,
    simple_duration_months: null,
  };
}

