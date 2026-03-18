import React from 'react';
import { WARRANTY_MODES, WARRANTY_ITEM_TYPES } from '@/lib/warranty';

const WarrantySummary = ({ warranty }) => {
  if (!warranty || !warranty.warranty_mode || warranty.warranty_mode === WARRANTY_MODES.NONE) {
    return <span className="text-[10px] md:text-xs text-muted-foreground">No Warranty</span>;
  }

  if (warranty.warranty_mode === WARRANTY_MODES.SIMPLE) {
    return (
      <span className="text-[10px] md:text-xs text-foreground">
        Warranty: {warranty.simple_duration_months ?? '?'} months
      </span>
    );
  }

  if (warranty.warranty_mode === WARRANTY_MODES.STANDARD) {
    return (
      <span className="text-[10px] md:text-xs text-foreground">
        Warranty: {warranty.profile_name || 'Standard profile'}
      </span>
    );
  }

  if (warranty.warranty_mode === WARRANTY_MODES.COMPLEX) {
    const items = Array.isArray(warranty.complex_items) ? warranty.complex_items : [];
    if (!items.length) {
      return (
        <span className="text-[10px] md:text-xs text-muted-foreground">
          Warranty: Advanced (not configured)
        </span>
      );
    }

    const labelForType = (type) => {
      switch (type) {
        case WARRANTY_ITEM_TYPES.PHONE_TO_PHONE:
          return 'Phone-to-Phone';
        case WARRANTY_ITEM_TYPES.SOFTWARE:
          return 'Software';
        case WARRANTY_ITEM_TYPES.SERVICE:
          return 'Service';
        case WARRANTY_ITEM_TYPES.APPLE_CARE:
          return 'Apple Care';
        default:
          return type;
      }
    };

    return (
      <div className="space-y-0.5 text-[10px] md:text-xs text-foreground">
        {items.map((item, idx) => (
          <div key={idx}>
            {labelForType(item.type)}: {item.duration} {item.duration_unit}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default WarrantySummary;

