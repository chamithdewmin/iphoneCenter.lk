import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search, Send, User, Phone, MessageSquare } from 'lucide-react';
import { getStorageData } from '@/utils/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const SendCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadedCustomers = getStorageData('customers', []);
    setCustomers(loadedCustomers);
    setFilteredCustomers(loadedCustomers);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const handleSend = () => {
    if (!selectedCustomer) {
      toast({
        title: "Validation Error",
        description: "Please select a customer",
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
      description: `SMS sent to ${selectedCustomer.name} (${selectedCustomer.phone})`,
    });
    setMessage('');
    setSelectedCustomer(null);
  };

  return (
    <>
      <Helmet>
        <title>Send SMS to Customer - iphone center.lk</title>
        <meta name="description" content="Send SMS to individual customer" />
      </Helmet>

      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Send SMS to Customer
          </h1>
          <p className="text-muted-foreground mt-1">Send SMS to individual customer</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Select Customer</h2>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id
                        ? 'border-primary bg-primary/10'
                        : 'border-secondary hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message Composition */}
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Compose Message</h2>
              {selectedCustomer ? (
                <>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{selectedCustomer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{selectedCustomer.phone}</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      rows="8"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.length} characters
                    </p>
                  </div>
                  <Button onClick={handleSend} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-30" />
                  <p className="text-sm text-muted-foreground">Select a customer to send SMS</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SendCustomer;
