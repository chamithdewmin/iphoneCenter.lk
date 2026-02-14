import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Users, CheckSquare } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const CustomMessage = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadedCustomers = getStorageData('customers', []);
    setCustomers(loadedCustomers);
  }, []);

  const toggleCustomer = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSend = () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one customer",
        variant: "destructive",
      });
      return;
    }
    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "SMS Sent",
      description: `Custom message sent to ${selectedCustomers.length} customer(s)`,
    });
    setMessage('');
    setSelectedCustomers([]);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Custom Message - iphone center.lk</title>
        <meta name="description" content="Send custom SMS messages" />
      </Helmet>

      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Custom Message
          </h1>
          <p className="text-muted-foreground mt-1">Send custom SMS messages to selected customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Select Customers</h2>
              <div className="relative mb-4">
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => toggleCustomer(customer.id)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomers.includes(customer.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-secondary hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {selectedCustomers.includes(customer.id) && (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-secondary">
                <p className="text-sm text-muted-foreground">
                  {selectedCustomers.length} of {customers.length} selected
                </p>
              </div>
            </div>
          </div>

          {/* Message Composition */}
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Compose Message</h2>
              <div>
                <Label htmlFor="message">Message *</Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your custom message here..."
                  rows="10"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length} characters
                </p>
              </div>
              <Button onClick={handleSend} className="w-full" size="lg">
                <Send className="w-4 h-4 mr-2" />
                Send to {selectedCustomers.length} Customer(s)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomMessage;
