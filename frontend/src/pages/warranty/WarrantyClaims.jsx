import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_OPTIONS = [
  'Pending',
  'Sent to Supplier',
  'Repairing',
  'Completed',
  'Rejected',
];

const WarrantyClaims = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const warrantyContext = location.state?.warrantyContext || null;
  const isNewClaimRoute = location.pathname.endsWith('/new');

  const [form, setForm] = useState({
    customer_name: '',
    product_name: '',
    imei: '',
    problem: '',
    claim_date: new Date().toISOString().slice(0, 10),
    status: 'Pending',
  });

  useEffect(() => {
    if (warrantyContext && isNewClaimRoute) {
      setForm((prev) => ({
        ...prev,
        customer_name: warrantyContext.customer_name || '',
        product_name: warrantyContext.product_name || '',
        imei: warrantyContext.imei || '',
      }));
      setCreating(true);
    } else if (isNewClaimRoute) {
      setCreating(true);
    } else {
      setCreating(false);
    }
  }, [warrantyContext, isNewClaimRoute]);

  const loadClaims = async () => {
    setLoading(true);
    setError('');
    const { ok, data } = await authFetch('/api/warranty/claims');
    setLoading(false);

    if (!ok || !data?.success) {
      setError(data?.message || 'Failed to load warranty claims.');
      return;
    }

    setClaims(data.data || []);
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleStatusChange = (value) => {
    setForm((prev) => ({ ...prev, status: value }));
    setFormError('');
  };

  const handleSaveClaim = async (e) => {
    e?.preventDefault();
    setFormError('');

    if (!form.problem.trim()) {
      setFormError('Enter problem description.');
      return;
    }

    setSaving(true);
    const payload = {
      invoice_item_id: warrantyContext?.invoice_item_id || null,
      customer_id: warrantyContext?.customer_id || null,
      customer_name: form.customer_name,
      product_name: form.product_name,
      imei: form.imei,
      problem: form.problem,
      claim_date: form.claim_date,
      status: form.status,
    };

    const { ok, data } = await authFetch('/api/warranty/claims', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });
    setSaving(false);

    if (!ok || !data?.success) {
      setFormError(data?.message || 'Failed to save warranty claim.');
      return;
    }

    await loadClaims();
    navigate('/warranty/claims');
  };

  const showForm = creating;

  const claimsWithDisplayId = useMemo(
    () =>
      (claims || []).map((c) => ({
        ...c,
        display_id: c.code || c.id || '',
      })),
    [claims]
  );

  return (
    <>
      <Helmet>
        <title>Warranty Claims - iphone center.lk</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Warranty Claims
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage customer warranty claims from all branches.
            </p>
          </div>

          {!showForm && (
            <Button onClick={() => navigate('/warranty/claims/new')}>
              New Claim
            </Button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSaveClaim}
            className="bg-card rounded-xl border border-secondary shadow-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="text-lg font-semibold text-foreground">
                Create Warranty Claim
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate('/warranty/claims')}
              >
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Customer</Label>
                <Input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleFormChange}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label>Product</Label>
                <Input
                  name="product_name"
                  value={form.product_name}
                  onChange={handleFormChange}
                  placeholder="Product name (ex: iPhone 14)"
                />
              </div>
              <div>
                <Label>IMEI</Label>
                <Input
                  name="imei"
                  value={form.imei}
                  onChange={handleFormChange}
                  placeholder="IMEI number"
                />
              </div>
              <div>
                <Label>Claim Date</Label>
                <Input
                  type="date"
                  name="claim_date"
                  value={form.claim_date}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-1">
                <Label>Problem Description</Label>
                <Textarea
                  name="problem"
                  value={form.problem}
                  onChange={handleFormChange}
                  className="min-h-[96px]"
                  placeholder="Describe the issue / fault reported by the customer"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-400 mt-1">{formError}</p>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save Claim'}
              </Button>
            </div>
          </form>
        )}

        <div className="bg-card rounded-xl border border-secondary shadow-sm p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Warranty Claims List
            </h2>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-secondary text-xs text-muted-foreground">
                  <th className="py-2 pr-4 text-left">Claim ID</th>
                  <th className="py-2 pr-4 text-left">Product</th>
                  <th className="py-2 pr-4 text-left">Customer</th>
                  <th className="py-2 pr-4 text-left">Date</th>
                  <th className="py-2 pr-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {claimsWithDisplayId.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 text-center text-xs text-muted-foreground"
                    >
                      {loading
                        ? 'Loading claims...'
                        : 'No warranty claims recorded yet.'}
                    </td>
                  </tr>
                )}
                {claimsWithDisplayId.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/40"
                  >
                    <td className="py-2 pr-4 whitespace-nowrap text-xs font-mono">
                      {c.display_id || `WC${String(c.id).padStart(3, '0')}`}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {c.product_name || 'N/A'}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {c.customer_name || 'N/A'}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {c.claim_date?.slice(0, 10) || '-'}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full border border-secondary/70 bg-secondary/40 px-2.5 py-0.5 text-[11px] font-medium">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default WarrantyClaims;

