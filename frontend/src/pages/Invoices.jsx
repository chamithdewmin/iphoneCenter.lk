import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { authFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { downloadInvoicePdf, printInvoicePdf } from '@/utils/invoicePdf';
import { FileText, Download, Printer, Eye, DollarSign, Loader2 } from 'lucide-react';

export default function Invoices() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewSale, setViewSale] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/billing/sales?limit=200');
      const data = res?.data?.data;
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to load invoices', variant: 'destructive' });
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // Open specific invoice when navigated from Sales page (state.openSaleId)
  useEffect(() => {
    const openSaleId = location.state?.openSaleId;
    if (openSaleId && list.length > 0) {
      fetchSaleById(openSaleId);
      navigate(location.pathname, { replace: true, state: {} }); // clear state so refresh doesn't reopen
    }
  }, [list.length, location.state?.openSaleId]);

  const pendingTotal = list
    .filter((s) => (s.payment_status || '').toLowerCase() !== 'paid')
    .reduce((sum, s) => sum + (parseFloat(s.due_amount) || 0), 0);

  const fetchSaleById = async (id) => {
    setViewLoading(true);
    try {
      const res = await authFetch(`/api/billing/sales/${id}`);
      const data = res?.data?.data;
      setViewSale(data || null);
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to load invoice', variant: 'destructive' });
      setViewSale(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleView = (sale) => {
    setViewSale(null);
    fetchSaleById(sale.id);
  };

  const handleDownload = async (sale) => {
    if (sale.items) {
      downloadInvoicePdf(sale);
      return;
    }
    try {
      const res = await authFetch(`/api/billing/sales/${sale.id}`);
      const data = res?.data?.data;
      if (data) downloadInvoicePdf(data);
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to load invoice', variant: 'destructive' });
    }
  };

  const handlePrint = async (sale) => {
    if (sale.items) {
      printInvoicePdf(sale);
      return;
    }
    try {
      const res = await authFetch(`/api/billing/sales/${sale.id}`);
      const data = res?.data?.data;
      if (data) printInvoicePdf(data);
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to load invoice', variant: 'destructive' });
    }
  };

  const handleMarkPaid = async (sale) => {
    const due = parseFloat(sale.due_amount) || 0;
    if (due <= 0) {
      toast({ title: 'Already paid', description: 'No due amount.', variant: 'default' });
      return;
    }
    setMarkingPaidId(sale.id);
    try {
      const res = await authFetch(`/api/billing/sales/${sale.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({ amount: due, paymentMethod: 'cash' }),
      });
      if (res?.ok && res?.data?.success) {
        toast({ title: 'Marked paid', description: `Invoice ${sale.invoice_number} marked paid.`, variant: 'default' });
        loadSales();
        if (viewSale?.id === sale.id) fetchSaleById(sale.id);
      } else {
        toast({ title: 'Error', description: res?.data?.message || 'Failed to add payment', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to add payment', variant: 'destructive' });
    } finally {
      setMarkingPaidId(null);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—');
  const statusColor = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'paid') return 'text-green-600';
    if (v === 'partial') return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <>
      <Helmet>
        <title>Invoices - iphone center.lk</title>
        <meta name="description" content="List and manage invoices" />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1">View, download, print and manage invoices</p>
        </div>

        {pendingTotal > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-medium text-foreground">Pending payments total</p>
              <p className="text-2xl font-bold text-amber-600">${pendingTotal.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Invoice #</th>
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-right p-3 font-medium">Items</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    list.map((sale) => (
                      <tr key={sale.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-medium">{sale.invoice_number || sale.id}</td>
                        <td className="p-3">{sale.customer_name || '—'}</td>
                        <td className="p-3">{formatDate(sale.created_at)}</td>
                        <td className="p-3 text-right">{sale.item_count ?? '—'}</td>
                        <td className="p-3 text-right font-medium">${Number(sale.total_amount || 0).toFixed(2)}</td>
                        <td className={`p-3 font-medium capitalize ${statusColor(sale.payment_status)}`}>
                          {sale.payment_status || '—'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleView(sale)}
                              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownload(sale)}
                              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrint(sale)}
                              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            {(sale.payment_status || '').toLowerCase() !== 'paid' && (parseFloat(sale.due_amount) || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(sale)}
                                disabled={markingPaidId === sale.id}
                                className="p-2 rounded-md hover:bg-green-500/20 text-green-600 disabled:opacity-50"
                                title="Mark Paid"
                              >
                                {markingPaidId === sale.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View invoice modal */}
      {(viewSale != null || viewLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setViewSale(null); setViewLoading(false); }}>
          <div className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice {viewSale?.invoice_number || ''}
              </h2>
              <button type="button" onClick={() => { setViewSale(null); setViewLoading(false); }} className="p-2 rounded-md hover:bg-muted text-muted-foreground">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {viewLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : viewSale ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    {viewSale.created_at && new Date(viewSale.created_at).toLocaleString()}
                    {viewSale.branch_name && ` · ${viewSale.branch_name}`}
                    {viewSale.cashier_name && ` · ${viewSale.cashier_name}`}
                  </p>
                  <p className="font-medium">{viewSale.customer_name || '—'}</p>
                  <p className="text-sm text-muted-foreground mb-4">{viewSale.customer_phone || '—'}</p>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-left">
                        <th className="pb-2">Item</th>
                        <th className="pb-2 w-12">Qty</th>
                        <th className="pb-2 w-20">Unit</th>
                        <th className="pb-2 w-20 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Array.isArray(viewSale.items) ? viewSale.items : []).map((row, idx) => (
                        <tr key={idx} className="border-b border-border">
                          <td className="py-2">{row.product_name || '—'}</td>
                          <td className="py-2">{row.quantity}</td>
                          <td className="py-2">${Number(row.unit_price).toFixed(2)}</td>
                          <td className="py-2 text-right">${Number(row.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                    <p className="flex justify-between"><span>Discount</span><span>−${Number(viewSale.discount_amount || 0).toFixed(2)}</span></p>
                    <p className="flex justify-between font-semibold text-foreground mt-2">
                      <span>Total</span><span>${Number(viewSale.total_amount || 0).toFixed(2)}</span>
                    </p>
                    <p className="mt-1">Status: {String(viewSale.payment_status || '—')}</p>
                  </div>
                </>
              ) : null}
            </div>
            {viewSale && !viewLoading && (
              <div className="p-4 border-t border-border flex gap-2 flex-wrap">
                <button type="button" onClick={() => downloadInvoicePdf(viewSale)} className="flex-1 min-w-[120px] px-4 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm font-medium">
                  Download PDF
                </button>
                <button type="button" onClick={() => printInvoicePdf(viewSale)} className="flex-1 min-w-[120px] px-4 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm font-medium">
                  Print
                </button>
                <button type="button" onClick={() => { setViewSale(null); setViewLoading(false); }} className="flex-1 min-w-[120px] px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
