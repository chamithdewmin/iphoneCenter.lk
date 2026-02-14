import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Send, Tag, MessageSquare, Users } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const Promotion = () => {
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadedCustomers = getStorageData('customers', []);
    setCustomers(loadedCustomers);
  }, []);

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a promotional message",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Promotion SMS Sent",
      description: `Promotional SMS sent to ${customers.length} customers`,
    });
    setMessage('');
    setPromoCode('');
  };

  return (
    <>
      <Helmet>
        <title>Promotion SMS - iphone center.lk</title>
        <meta name="description" content="Send promotional SMS" />
      </Helmet>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Promotion SMS
          </h1>
          <p className="text-muted-foreground mt-1">Send promotional messages to customers</p>
        </div>

        <div className="bg-card rounded-xl border border-secondary shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Promotion Details</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                  <Input
                    id="promoCode"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g., SUMMER2024"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Promotional Message *</Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your promotional message here..."
                    rows="8"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.length} characters
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-secondary pt-6">
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Recipients</span>
                  </div>
                  <span className="font-semibold">{customers.length} customers</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-secondary p-6 bg-secondary/30">
            <Button onClick={handleSend} className="w-full" size="lg">
              <Send className="w-4 h-4 mr-2" />
              Send Promotion SMS
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Promotion;
