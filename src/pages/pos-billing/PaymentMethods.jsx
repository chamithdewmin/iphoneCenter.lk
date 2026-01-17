import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, QrCode, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const PaymentMethods = () => {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [amount, setAmount] = useState(10000);
  const [paidAmount, setPaidAmount] = useState('');
  const { toast } = useToast();

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Wallet, color: 'bg-green-500' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'qr', label: 'QR Code', icon: QrCode, color: 'bg-purple-500' },
  ];

  const handleProcessPayment = () => {
    if (!paidAmount || parseFloat(paidAmount) < amount) {
      toast({
        title: "Validation Error",
        description: "Paid amount must be equal to or greater than total amount",
        variant: "destructive",
      });
      return;
    }
    const change = parseFloat(paidAmount) - amount;
    toast({
      title: "Payment Processed",
      description: `Payment of LKR ${paidAmount} received via ${selectedMethod}. ${change > 0 ? `Change: LKR ${change.toLocaleString()}` : ''}`,
    });
  };

  return (
    <>
      <Helmet>
        <title>Payment Methods - iphone center.lk</title>
        <meta name="description" content="Select payment method" />
      </Helmet>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Payment Methods
          </h1>
          <p className="text-muted-foreground mt-1">Select payment method for the sale</p>
        </div>

        <div className="bg-card rounded-xl border border-secondary shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-3 gap-4">
                {paymentMethods.map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        selectedMethod === method.id
                          ? 'border-primary bg-primary/10'
                          : 'border-secondary hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-medium">{method.label}</span>
                        {selectedMethod === method.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-secondary pt-6">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <div className="space-y-4">
                <div>
                  <Label>Total Amount (LKR)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Amount Paid (LKR) *</Label>
                  <Input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    min={amount}
                    className="mt-1"
                  />
                </div>
                {paidAmount && parseFloat(paidAmount) >= amount && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-green-600 dark:text-green-400 font-medium">Change</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        LKR {(parseFloat(paidAmount) - amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-secondary p-6 bg-secondary/30">
            <Button onClick={handleProcessPayment} className="w-full" size="lg">
              Process Payment
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentMethods;
