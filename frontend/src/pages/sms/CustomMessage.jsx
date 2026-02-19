import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Users, CheckSquare, RefreshCw, Search } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const CustomMessage = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await authFetch('/api/customers');
    setLoading(false);
    if (!ok) {
      toast({
        title: 'Failed to load customers',
        description: data?.message || 'Please try again',
        variant: 'destructive',
      });
      setCustomers([]);
      return;
    }
    const list = Array.isArray(data?.data) ? data.data : [];
    setCustomers(list);
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const toggleCustomer = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSend = async () => {
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

    const selectedCustomersData = customers.filter(c => selectedCustomers.includes(c.id) && c.phone);
    if (selectedCustomersData.length === 0) {
      toast({
        title: "Validation Error",
        description: "Selected customers do not have phone numbers",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to send this message to ${selectedCustomersData.length} customer(s)?`)) {
      return;
    }

    setSending(true);
    try {
      const phoneNumbers = selectedCustomersData.map(c => c.phone);
      const { ok, data } = await authFetch('/api/sms/bulk', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumbers,
          message: message.trim(),
        }),
      });

      if (!ok) {
        toast({
          title: "Failed to send SMS",
          description: data?.message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "SMS Sent",
        description: data?.message || `Custom message sent to ${data?.data?.success || 0} customer(s)`,
      });
      setMessage('');
      setSelectedCustomers([]);
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Error",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone || '').includes(searchQuery) ||
    (customer.email || '').toLowerCase().includes(searchQuery.toLowerCase())
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Select Customers</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchCustomers}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading customers...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No customers found' : 'No customers available'}
                </div>
              ) : (
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
              )}
              <div className="mt-4 pt-4 border-t border-secondary">
                <p className="text-sm text-muted-foreground">
                  {selectedCustomers.length} of {customers.length} selected
                  {selectedCustomers.length > 0 && (
                    <span className="ml-2">
                      ({customers.filter(c => selectedCustomers.includes(c.id) && c.phone).length} with phone numbers)
                    </span>
                  )}
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
              <Button onClick={handleSend} className="w-full" size="lg" disabled={sending || selectedCustomers.length === 0 || customers.filter(c => selectedCustomers.includes(c.id) && c.phone).length === 0}>
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send to {customers.filter(c => selectedCustomers.includes(c.id) && c.phone).length} Customer(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomMessage;
