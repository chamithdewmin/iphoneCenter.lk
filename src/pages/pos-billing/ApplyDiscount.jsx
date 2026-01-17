import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Percent, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ApplyDiscount = () => {
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [orderTotal, setOrderTotal] = useState(10000);
  const { toast } = useToast();

  const calculateDiscount = () => {
    if (!discountValue) return 0;
    if (discountType === 'percentage') {
      return (orderTotal * parseFloat(discountValue)) / 100;
    }
    return parseFloat(discountValue);
  };

  const finalTotal = orderTotal - calculateDiscount();

  const handleApply = () => {
    if (!discountValue) {
      toast({
        title: "Validation Error",
        description: "Please enter a discount value",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Discount Applied",
      description: `Discount of ${discountType === 'percentage' ? discountValue + '%' : 'LKR ' + discountValue} applied`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Apply Discount - iphone center.lk</title>
        <meta name="description" content="Apply discount to sale" />
      </Helmet>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Apply Discount
          </h1>
          <p className="text-muted-foreground mt-1">Apply discount to current sale</p>
        </div>

        <div className="bg-card rounded-xl border border-secondary shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Discount Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Discount Type</Label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (LKR)</option>
                  </select>
                </div>
                <div>
                  <Label>
                    Discount Value {discountType === 'percentage' ? '(%)' : '(LKR)'}
                  </Label>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '0' : '0.00'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : orderTotal}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-secondary pt-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-semibold">LKR {orderTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-semibold text-red-500">
                    - LKR {calculateDiscount().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-secondary">
                  <span className="font-bold text-lg">Final Total</span>
                  <span className="font-bold text-lg text-primary">
                    LKR {finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-secondary p-6 bg-secondary/30">
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleApply}>
                <Save className="w-4 h-4 mr-2" />
                Apply Discount
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplyDiscount;
