import React from 'react';
import { WARRANTY_ITEM_TYPES, DURATION_UNITS } from '@/lib/warranty';

const WARRANTY_ITEM_TYPE_OPTIONS = [
  { value: WARRANTY_ITEM_TYPES.PHONE_TO_PHONE, label: 'Phone-to-Phone' },
  { value: WARRANTY_ITEM_TYPES.SOFTWARE, label: 'Software' },
  { value: WARRANTY_ITEM_TYPES.SERVICE, label: 'Service' },
  { value: WARRANTY_ITEM_TYPES.APPLE_CARE, label: 'Apple Care' },
];

const WarrantyAdvancedBuilder = ({ items, onChange }) => {
  const handleItemChange = (index, patch) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    onChange(updated);
  };

  const handleAddItem = () => {
    onChange([
      ...items,
      {
        type: WARRANTY_ITEM_TYPES.PHONE_TO_PHONE,
        duration: 30,
        duration_unit: 'days',
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 border rounded-md p-3 bg-muted/40">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-foreground">
          Advanced Warranty Components
        </h4>
        <button
          type="button"
          onClick={handleAddItem}
          className="text-xs px-2 py-1 rounded border border-input hover:bg-secondary"
        >
          + Add Warranty Item
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No warranty items yet. Click &ldquo;Add Warranty Item&rdquo; to begin.
        </p>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end bg-card border border-secondary rounded p-2"
        >
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Type
            </label>
            <select
              className="border rounded px-2 py-1 text-xs md:text-sm bg-background"
              value={item.type}
              onChange={(e) =>
                handleItemChange(index, { type: e.target.value })
              }
            >
              {WARRANTY_ITEM_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Duration
            </label>
            <input
              type="number"
              min={1}
              className="border rounded px-2 py-1 text-xs md:text-sm bg-background"
              value={item.duration}
              onChange={(e) =>
                handleItemChange(index, {
                  duration: Number(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">
              Unit
            </label>
            <select
              className="border rounded px-2 py-1 text-xs md:text-sm bg-background"
              value={item.duration_unit}
              onChange={(e) =>
                handleItemChange(index, { duration_unit: e.target.value })
              }
            >
              {DURATION_UNITS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end md:justify-start">
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="text-xs text-red-600 hover:text-red-700 px-2 py-1"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WarrantyAdvancedBuilder;

