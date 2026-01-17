import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Receipt, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ApplyTax = () => {
  const [taxRate, setTaxRate] = useState('10');
  const [subtotal, setSubtotal] = useState(10000);
  const { toast } = useToast();

  const taxAmount = (subtotal * parseFloat(taxRate)) / 100;
  const finalTotal = subtotal + taxAmount;

  const handleApply = () => {
    toast({
      title: "Tax Applied",
      description: `Tax of ${taxRate}% (LKR ${taxAmount.toLocaleString()}) applied`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Apply Tax - iphone center.lk</title>
        <meta name="description" content="Apply tax to sale" />
      </Helmet>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Apply Tax
          </h1>
          <p className="text-muted-foreground mt-1">Apply tax to current sale</p>
        </div>

        <div className="bg-card rounded-xl border border-secondary shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Tax Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Subtotal (LKR)</Label>
                  <Input
                    type="number"
                    value={subtotal}
                    onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.1"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-secondary pt-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">LKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span className="font-semibold text-primary">
                    + LKR {taxAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-secondary">
                  <span className="font-bold text-lg">Total</span>
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
                Apply Tax
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApplyTax;
