import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const WarrantyChecker = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e?.preventDefault();
    setError('');
    setResult(null);

    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter IMEI, invoice number, or customer name.');
      return;
    }

    setLoading(true);
    const { ok, data } = await authFetch(
      `/api/warranty/check?query=${encodeURIComponent(trimmed)}`
    );
    setLoading(false);

    if (!ok || !data?.success || !data.data) {
      setError(
        data?.message ||
          'Warranty record not found. Check IMEI / invoice / customer and try again.'
      );
      return;
    }

    setResult(data.data);
  };

  const handleCreateClaim = () => {
    if (!result) return;
    navigate('/warranty/claims/new', {
      state: { warrantyContext: result },
    });
  };

  const status =
    result?.status === 'UNDER_WARRANTY'
      ? 'Under Warranty'
      : result?.status === 'EXPIRED'
      ? 'Warranty Expired'
      : result?.status || 'Unknown';

  const statusStyles =
    result?.status === 'UNDER_WARRANTY'
      ? 'text-green-400 bg-green-500/10 border-green-500/30'
      : 'text-red-400 bg-red-500/10 border-red-500/30';

  return (
    <>
      <Helmet>
        <title>Warranty Checker - iphone center.lk</title>
      </Helmet>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Warranty Checker
          </h1>
          <p className="text-muted-foreground mt-1">
            Search by IMEI, invoice number, or customer name to view warranty status.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-card rounded-xl border border-secondary shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Search Warranty</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty-query">IMEI / Invoice / Customer</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="warranty-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter IMEI, invoice number, or customer name"
                className="flex-1 text-foreground bg-background"
              />
              <Button type="submit" disabled={loading} className="px-6">
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 flex items-center gap-2 mt-1">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}
        </form>

        {result && (
          <div className="bg-card rounded-xl border border-secondary shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Result
                </p>
                <h2 className="text-xl font-semibold text-foreground">
                  {result.product_name || 'Product'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invoice #{result.invoice_number} • {result.branch_name || 'Branch'}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles}`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{status}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Customer</p>
                <p className="text-foreground font-semibold">
                  {result.customer_name || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">IMEI</p>
                <p className="text-foreground font-mono text-sm">
                  {result.imei || 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Sold Date</p>
                <p className="text-foreground">{result.sold_date || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Warranty</p>
                <p className="text-foreground">
                  {result.warranty_months ? `${result.warranty_months} Months` : 'No warranty'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Expiry</p>
                <p className="text-foreground">{result.warranty_expiry || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Status</p>
                <p className="text-foreground">{status}</p>
              </div>
            </div>

            {result.status === 'UNDER_WARRANTY' && (
              <div className="pt-3">
                <Button type="button" onClick={handleCreateClaim}>
                  Create Warranty Claim
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default WarrantyChecker;

