import React, { useState, useEffect } from 'react';
import {
  PRODUCT_TYPES,
  WARRANTY_MODES,
  SIMPLE_WARRANTY_DURATIONS,
  getDefaultWarrantyForProduct,
  WARRANTY_ITEM_TYPES,
} from '@/lib/warranty';
import WarrantyAdvancedBuilder from '@/components/warranty/WarrantyAdvancedBuilder';

const WarrantySection = ({
  productType,
  condition,
  warrantyState,
  onWarrantyChange,
  warrantyProfiles = [],
  isSmartPhoneCategory = false,
}) => {
  const [expanded, setExpanded] = useState(
    productType === PRODUCT_TYPES.PHONE
  );

  useEffect(() => {
    const defaults = getDefaultWarrantyForProduct(productType, condition);

    // For smart phone category, pre-fill complex warranty with fixed items
    if (isSmartPhoneCategory) {
      onWarrantyChange({
        warranty_mode: WARRANTY_MODES.COMPLEX,
        simple_duration_months: null,
        warranty_profile_id: null,
        complex_items: [
          {
            type: WARRANTY_ITEM_TYPES.PHONE_TO_PHONE,
            // 1.5 months ≈ 45 days
            duration: 45,
            duration_unit: 'days',
          },
          {
            type: WARRANTY_ITEM_TYPES.SOFTWARE,
            duration: 24,
            duration_unit: 'months', // 2 years
          },
          {
            type: WARRANTY_ITEM_TYPES.SERVICE,
            duration: 24,
            duration_unit: 'months', // 2 years
          },
          {
            type: WARRANTY_ITEM_TYPES.APPLE_CARE,
            duration: 12,
            duration_unit: 'months', // 1 year
          },
        ],
      });
      return;
    }

    onWarrantyChange((prev) => ({
      ...prev,
      ...defaults,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productType, condition, isSmartPhoneCategory]);

  const isAdvancedVisible =
    isSmartPhoneCategory ||
    productType === PRODUCT_TYPES.PHONE ||
    warrantyState.warranty_mode === WARRANTY_MODES.COMPLEX;

  const handleModeChange = (mode) => {
    onWarrantyChange((prev) => ({
      ...prev,
      warranty_mode: mode,
      simple_duration_months:
        mode === WARRANTY_MODES.SIMPLE
          ? prev.simple_duration_months || 12
          : null,
      warranty_profile_id:
        mode === WARRANTY_MODES.STANDARD ? prev.warranty_profile_id : null,
      complex_items:
        mode === WARRANTY_MODES.COMPLEX ? prev.complex_items || [] : [],
    }));
  };

  return (
    <div className="border border-secondary rounded-lg overflow-hidden bg-card mt-6">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/60"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            Warranty
          </span>
          <span className="text-xs text-muted-foreground">
            {expanded ? 'Hide' : 'Show'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {expanded ? '▴' : '▾'}
        </span>
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Configure how warranty behaves for this product. Keep it simple for
            normal items, and use advanced warranty for phones or complex
            services.
          </p>

          {/* Warranty mode selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="warranty_mode"
                checked={warrantyState.warranty_mode === WARRANTY_MODES.NONE}
                onChange={() => handleModeChange(WARRANTY_MODES.NONE)}
                disabled={isSmartPhoneCategory}
              />
              <span>No Warranty</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="warranty_mode"
                checked={warrantyState.warranty_mode === WARRANTY_MODES.SIMPLE}
                onChange={() => handleModeChange(WARRANTY_MODES.SIMPLE)}
              />
              <span>Simple Warranty</span>
            </label>

            {!isSmartPhoneCategory && (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="warranty_mode"
                    checked={
                      warrantyState.warranty_mode === WARRANTY_MODES.STANDARD
                    }
                    onChange={() => handleModeChange(WARRANTY_MODES.STANDARD)}
                    disabled={warrantyProfiles.length === 0}
                  />
                  <span>Standard Warranty</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="warranty_mode"
                    checked={
                      warrantyState.warranty_mode === WARRANTY_MODES.COMPLEX
                    }
                    onChange={() => handleModeChange(WARRANTY_MODES.COMPLEX)}
                    disabled={!isAdvancedVisible}
                  />
                  <span>Advanced Warranty</span>
                </label>
              </>
            )}

            {isSmartPhoneCategory && (
              <span className="text-xs text-muted-foreground col-span-2">
                Smart Phone category uses fixed advanced warranty:
                Phone-to-Phone 1.5 months, Software 2 years, Service 2 years,
                Apple Care 1 year.
              </span>
            )}
          </div>

          {/* Simple mode */}
          {warrantyState.warranty_mode === WARRANTY_MODES.SIMPLE && (
            <div className="flex flex-col mt-1 max-w-xs">
              <label className="text-xs font-medium text-muted-foreground mb-1">
                Duration
              </label>
              <select
                className="border rounded px-2 py-1 text-sm bg-background"
                value={warrantyState.simple_duration_months || ''}
                onChange={(e) =>
                  onWarrantyChange((prev) => ({
                    ...prev,
                    simple_duration_months: Number(e.target.value) || null,
                  }))
                }
              >
                <option value="">Select duration</option>
                {SIMPLE_WARRANTY_DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Standard / profile mode */}
          {!isSmartPhoneCategory &&
            warrantyState.warranty_mode === WARRANTY_MODES.STANDARD && (
            <div className="flex flex-col mt-1 max-w-xs">
              <label className="text-xs font-medium text-muted-foreground mb-1">
                Warranty Profile
              </label>
              <select
                className="border rounded px-2 py-1 text-sm bg-background"
                value={warrantyState.warranty_profile_id || ''}
                onChange={(e) =>
                  onWarrantyChange((prev) => ({
                    ...prev,
                    warranty_profile_id: e.target.value || null,
                  }))
                }
              >
                <option value="">Select profile</option>
                {warrantyProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {warrantyProfiles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No standard profiles configured yet for this product type.
                </p>
              )}
            </div>
          )}

          {/* Advanced / complex mode */}
          {warrantyState.warranty_mode === WARRANTY_MODES.COMPLEX && (
            <WarrantyAdvancedBuilder
              items={warrantyState.complex_items || []}
              onChange={(items) =>
                onWarrantyChange((prev) => ({
                  ...prev,
                  complex_items: items,
                }))
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default WarrantySection;

