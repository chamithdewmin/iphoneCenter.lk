import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Send, Mail, Users, MessageSquare, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const Bulk = () => {
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState('');
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

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    const customersWithPhone = customers.filter(c => c.phone && c.phone.trim());
    if (customersWithPhone.length === 0) {
      toast({
        title: "Validation Error",
        description: "No customers with phone numbers found",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to send this message to ${customersWithPhone.length} customer(s)?`)) {
      return;
    }

    setSending(true);
    try {
      const phoneNumbers = customersWithPhone.map(c => c.phone);
      const { ok, data } = await authFetch('/api/sms/bulk', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumbers,
          message: message.trim(),
        }),
      });

      if (!ok) {
        toast({
          title: "Failed to send bulk SMS",
          description: data?.message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Bulk SMS Sent",
        description: data?.message || `SMS sent to ${data?.data?.success || 0} customer(s)`,
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Bulk SMS - iphone center.lk</title>
        <meta name="description" content="Send bulk SMS to customers" />
      </Helmet>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Bulk SMS
          </h1>
          <p className="text-muted-foreground mt-1">Send SMS to multiple customers at once</p>
        </div>

        <div className="bg-card rounded-xl border border-secondary shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Recipients</h2>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Customers</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchCustomers}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <span className="font-semibold">{customers.length}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Message will be sent to all customers with phone numbers ({customers.filter(c => c.phone).length} customers)
                </p>
              </div>
            </div>

            <div className="border-t border-secondary pt-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Message</h2>
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
            </div>
          </div>

          <div className="border-t border-secondary p-6 bg-secondary/30">
            <Button onClick={handleSend} className="w-full" size="lg" disabled={sending || loading || customers.filter(c => c.phone).length === 0}>
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Bulk SMS ({customers.filter(c => c.phone).length} recipients)
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Bulk;
