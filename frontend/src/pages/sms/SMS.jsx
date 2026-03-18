import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Send, Search, RefreshCw, Users } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const SMS = () => {
  const MAX_MESSAGE_CHARS = 621;
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

      <div className="space-y-6">
        <div className="w-full max-w-7xl">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                SMS
              </h1>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-card/40 border border-secondary rounded-xl overflow-hidden">
            <div className="p-6 border-b border-secondary/70">
            </div>

            {/* Table + search */}
            <div className="p-6">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 bg-[rgb(10,10,10)]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={fetchCustomers}
                  disabled={loading}
                  title="Refresh"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
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
                    disabled={selectedIds.length === 0}
                  >
                    Deselect all
                  </Button>
                </div>

                <div className="grid grid-cols-[30px_1fr_190px] gap-2 text-sm text-muted-foreground px-2 py-2 border border-secondary rounded-lg">
                <div className="pl-2" />
                <div>Name</div>
                <div className="text-right pr-3">Phone</div>
              </div>

              <div className="border border-secondary rounded-lg mt-2 overflow-hidden">
                {loading ? (
                  <div className="text-center py-10 text-muted-foreground">
                    Loading customers...
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    {searchQuery
                      ? 'No customers match name or phone'
                      : 'No customers with phone numbers'}
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {filtered.map((customer) => {
                      const selected = selectedIds.includes(customer.id);
                      return (
                        <div
                          key={customer.id}
                          onClick={() => toggleOne(customer.id)}
                          className={`grid grid-cols-[30px_1fr_190px] gap-2 items-center px-2 py-2 border-t border-secondary/40 cursor-pointer transition-colors ${
                            selected ? 'bg-primary/10' : 'bg-transparent hover:bg-secondary/20'
                          }`}
                        >
                          <div className="pl-1">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                selected
                                  ? 'bg-primary border-primary'
                                  : 'border-input bg-background/40'
                              }`}
                            >
                              {selected && (
                                <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                              )}
                            </div>
                          </div>
                          <div className="text-base font-medium truncate">
                            {customer.name || '—'}
                          </div>
                          <div className="text-right pr-3 text-base text-muted-foreground font-medium font-mono truncate">
                            {customer.phone || '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Message + send */}
            <div className="p-6 border-t border-secondary/70">
              <div className="mb-2">
                <Label
                  htmlFor="sms-message"
                  className="text-base text-muted-foreground"
                >
                  Message (max {MAX_MESSAGE_CHARS} chars)
                </Label>
              </div>

              <textarea
                id="sms-message"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, MAX_MESSAGE_CHARS))
                }
                placeholder="Type your message..."
                className="w-full min-h-[160px] px-3 py-2 rounded-lg border border-secondary bg-[rgb(10,10,10)] text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              />

              <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-muted-foreground">
                  {message.length}/{MAX_MESSAGE_CHARS}
                </div>
                <Button
                  onClick={handleSend}
                  disabled={sending || !message.trim() || phoneNumbers.length === 0}
                  className="min-w-[220px] justify-center"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to {phoneNumbers.length} recipient(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMS;
