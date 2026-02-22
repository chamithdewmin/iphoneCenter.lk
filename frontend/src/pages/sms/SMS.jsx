import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Send, MessageSquare, Users, Search, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const SMS = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
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

  const withPhone = customers.filter((c) => c.phone && String(c.phone).trim());
  const filtered = withPhone.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      String(c.phone || '').includes(searchQuery.trim())
  );

  const toggleOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(filtered.map((c) => c.id));
    toast({
      title: 'Select all',
      description: `All ${filtered.length} customer(s) with phone numbers are selected for SMS.`,
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const selectedWithPhone = customers.filter(
    (c) => selectedIds.includes(c.id) && c.phone
  );
  const phoneNumbers = selectedWithPhone.map((c) => String(c.phone).trim());

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a message',
        variant: 'destructive',
      });
      return;
    }
    if (phoneNumbers.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Select at least one customer with a phone number',
        variant: 'destructive',
      });
      return;
    }

    if (
      !window.confirm(
        `Send this message to ${phoneNumbers.length} customer(s)?`
      )
    ) {
      return;
    }

    setSending(true);
    try {
      const { ok, data } = await authFetch('/api/sms/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumbers,
          message: message.trim(),
        }),
      });

      if (!ok) {
        toast({
          title: 'Failed to send SMS',
          description: data?.message || 'Please try again',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'SMS Sent',
        description:
          data?.message ||
          `SMS sent to ${data?.data?.success ?? phoneNumbers.length} customer(s)`,
      });
      setMessage('');
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send SMS. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>SMS - iphone center.lk</title>
        <meta name="description" content="Send SMS to customers" />
      </Helmet>

      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-3xl font-bold">SMS</h1>
          <p className="text-muted-foreground mt-1">
            Compose a message and select customers to send SMS
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message area */}
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Message</h2>
              </div>
              <div>
                <Label htmlFor="sms-message">Message *</Label>
                <textarea
                  id="sms-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={10}
                  className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.length} characters
                </p>
              </div>
            </div>
          </div>

          {/* Customers */}
          <div className="bg-card rounded-xl border border-secondary shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Select customers
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchCustomers}
                  disabled={loading}
                  title="Refresh"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={loading || filtered.length === 0}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Deselect all
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading customers...
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? 'No customers match name or phone'
                    : 'No customers with phone numbers'}
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2">
                  {filtered.map((customer) => {
                    const selected = selectedIds.includes(customer.id);
                    return (
                      <div
                        key={customer.id}
                        onClick={() => toggleOne(customer.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-secondary hover:bg-secondary/50'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex-shrink-0 ${
                            selected
                              ? 'bg-primary border-primary'
                              : 'border-input bg-background'
                          }`}
                        >
                          {selected && (
                            <svg
                              className="w-full h-full text-primary-foreground"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customer.name || '—'}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phone || '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-secondary text-sm text-muted-foreground">
                {selectedIds.length} selected
                {phoneNumbers.length > 0 &&
                  ` (${phoneNumbers.length} with phone for SMS)`}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-secondary p-6">
          <Button
            onClick={handleSend}
            className="w-full"
            size="lg"
            disabled={
              sending ||
              !message.trim() ||
              phoneNumbers.length === 0
            }
          >
            {sending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send SMS to {phoneNumbers.length} customer(s)
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default SMS;
