import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { authFetch } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { downloadInvoicePdf, printInvoicePdf } from '@/utils/invoicePdf';
import { FileText, Download, Printer, Eye, DollarSign, Loader2 } from 'lucide-react';
import DataTable from '@/components/DataTable';
import Loading from '@/components/Loading';

export default function Invoices() {
  const [list, setList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewSale, setViewSale] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const loadSales = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/billing/sales?limit=200');
      const data = res?.data?.data;
      setList(Array.isArray(data) ? data : []);
      setFilteredList(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({ title: 'Error', description: e?.message || 'Failed to load invoices', variant: 'destructive' });
      setList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    let filtered = [...list];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.invoice_number || '').toLowerCase().includes(q) ||
          (s.customer_name || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => (s.payment_status || '').toLowerCase() === statusFilter);
    }
    setFilteredList(filtered);
    setCurrentPage(1);
  }, [list, searchQuery, statusFilter]);

  // Open specific invoice when navigated from Sales page (state.openSaleId)
  useEffect(() => {
    const openSaleId = location.state?.openSaleId;
    if (openSaleId && list.length > 0) {
      fetchSaleById(openSaleId);
      navigate(location.pathname, { replace: true, state: {} });
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
        headers: { 'Content-Type': 'application/json' },
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

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const getStatusBadge = (paymentStatus) => {
    const v = (paymentStatus || '').toLowerCase();
    const styles = {
      paid: 'bg-green-500/20 text-green-600 dark:text-green-400',
      partial: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      due: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    const label = v === 'paid' ? 'Paid' : v === 'partial' ? 'Partial' : 'Due';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[v] || styles.due}`}>{label}</span>
    );
  };

  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));

  const columns = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (sale) => (
        <span className="text-foreground font-medium text-sm font-mono">{sale.invoice_number || sale.id || '—'}</span>
      ),
    },
    {
      key: 'client',
      label: 'Client',
      render: (sale) => (
        <div>
          <div className="text-foreground font-medium text-sm">{sale.customer_name || '—'}</div>
          {sale.customer_phone && (
            <div className="text-muted-foreground text-xs">{sale.customer_phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (sale) => <span className="text-muted-foreground text-sm">{formatDate(sale.created_at)}</span>,
    },
    {
      key: 'items',
      label: 'Items',
      render: (sale) => (
        <span className="text-muted-foreground text-sm">{sale.item_count ?? '—'}</span>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (sale) => (
        <span className="text-foreground font-medium text-sm">
          LKR {(parseFloat(sale.total_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (sale) => getStatusBadge(sale.payment_status),
    },
  ];

  const renderRowActions = (sale) => (
    <div className="flex items-center gap-2 text-muted-foreground">
      <button
        type="button"
        onClick={() => handleView(sale)}
        className="hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDownload(sale)}
        className="hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
        title="Download PDF"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handlePrint(sale)}
        className="hover:text-foreground transition-colors p-1 rounded hover:bg-secondary"
        title="Print"
      >
        <Printer className="w-4 h-4" />
      </button>
      {(sale.payment_status || '').toLowerCase() !== 'paid' && (parseFloat(sale.due_amount) || 0) > 0 && (
        <button
          type="button"
          onClick={() => handleMarkPaid(sale)}
          disabled={markingPaidId === sale.id}
          className="hover:text-green-600 transition-colors p-1 rounded hover:bg-secondary disabled:opacity-50"
          title="Mark Paid"
        >
          {markingPaidId === sale.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
        </button>
      )}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Invoices - iphone center.lk</title>
        <meta name="description" content="List and manage invoices" />
      </Helmet>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">View, download, print and manage invoices</p>
        </div>

        {pendingTotal > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-medium text-foreground">Pending payments total</p>
              <p className="text-2xl font-bold text-amber-600">LKR {pendingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}

        {/* Filters - same style as Per Orders */}
        <div className="bg-card rounded-lg p-4 border border-secondary px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by invoice # or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-3 pr-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-[200px] h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="due">Due</option>
            </select>
          </div>
        </div>

        {/* Table - same design as Per Orders (DataTable) */}
        <div className="px-4">
          <DataTable
            title="Invoices"
            count={filteredList.length}
            data={paginatedList}
            columns={columns}
            loading={loading}
            emptyMessage={list.length === 0 ? 'No invoices found.' : 'No invoices match your search.'}
            emptyIcon={FileText}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            renderRowActions={renderRowActions}
            getRowId={(row) => row.id}
          />
        </div>
      </div>

      {/* View invoice modal */}
      {(viewSale != null || viewLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => {
            setViewSale(null);
            setViewLoading(false);
          }}
        >
          <div
            className="bg-card rounded-xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice {viewSale?.invoice_number || ''}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setViewSale(null);
                  setViewLoading(false);
                }}
                className="p-2 rounded-md hover:bg-muted text-muted-foreground"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {viewLoading ? (
                <div className="flex justify-center py-8">
                  <Loading text={null} fullScreen={false} />
                </div>
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
                          <td className="py-2">LKR {Number(row.unit_price).toFixed(2)}</td>
                          <td className="py-2 text-right">LKR {Number(row.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                    <p className="flex justify-between">
                      <span>Discount</span>
                      <span>− LKR {Number(viewSale.discount_amount || 0).toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between font-semibold text-foreground mt-2">
                      <span>Total</span>
                      <span>LKR {Number(viewSale.total_amount || 0).toFixed(2)}</span>
                    </p>
                    <p className="mt-1">Status: {String(viewSale.payment_status || '—')}</p>
                  </div>
                </>
              ) : null}
            </div>
            {viewSale && !viewLoading && (
              <div className="p-4 border-t border-border flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadInvoicePdf(viewSale)}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm font-medium"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => printInvoicePdf(viewSale)}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm font-medium"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewSale(null);
                    setViewLoading(false);
                  }}
                  className="flex-1 min-w-[120px] px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                >
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
