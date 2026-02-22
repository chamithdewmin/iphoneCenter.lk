import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Download, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const SaleReport = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';
  const [branches, setBranches] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]);
  const [profitByDay, setProfitByDay] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().slice(0, 7) + '-01',
    endDate: new Date().toISOString().slice(0, 10),
    branchId: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdmin) return;
    authFetch('/api/branches')
      .then((res) => {
        if (res.ok && res.data?.data) setBranches(Array.isArray(res.data.data) ? res.data.data : []);
      })
      .catch(() => setBranches([]));
  }, [isAdmin]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.branchId) params.set('branchId', filters.branchId);

    const [salesRes, profitRes] = await Promise.all([
      authFetch(`/api/reports/sales?${params.toString()}`),
      authFetch(`/api/reports/profit?${params.toString()}`),
    ]);

    if (!salesRes.ok) {
      setError(salesRes.data?.message || 'Failed to load sales report');
      setSalesSummary([]);
      setProfitByDay([]);
    } else {
      const salesData = Array.isArray(salesRes.data?.data) ? salesRes.data.data : [];
      setSalesSummary(salesData);
      const profitData = Array.isArray(profitRes.data?.data) ? profitRes.data.data : [];
      const byDate = {};
      profitData.forEach((row) => {
        const d = row.sale_date || row.sale_date;
        if (!d) return;
        const key = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
        if (!byDate[key]) byDate[key] = { date: key, revenue: 0, sales: 0 };
        byDate[key].revenue += parseFloat(row.total_revenue) || 0;
        byDate[key].sales += parseInt(row.total_sales, 10) || 0;
      });
      setProfitByDay(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
    }
    setLoading(false);
  }, [filters.startDate, filters.endDate, filters.branchId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const totalRevenue = salesSummary.reduce((s, r) => s + (parseFloat(r.total_revenue) || 0), 0);
  const totalOrders = salesSummary.reduce((s, r) => s + (parseInt(r.total_sales, 10) || 0), 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const handleExport = () => {
    const rows = [
      ['Date', 'Revenue', 'Orders'],
      ...profitByDay.map((d) => [d.date, d.revenue.toFixed(0), d.sales]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `sale-report-${filters.startDate}-${filters.endDate}.csv`;
    a.click();
    toast({ title: 'Export successful', description: 'Sale report downloaded.' });
  };

  return (
    <>
      <Helmet>
        <title>Sale Report - iphone center.lk</title>
        <meta name="description" content="View sales report" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Sale Report
            </h1>
            <p className="text-muted-foreground mt-1">Sales analytics from backend (date range & branch)</p>
          </div>
          <Button onClick={handleExport} variant="outline" disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Date range & branch */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <label className="text-xs text-muted-foreground block mb-1">From</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
              className="w-40"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
              className="w-40"
            />
          </div>
          {isAdmin && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Branch</label>
              <select
                value={filters.branchId}
                onChange={(e) => setFilters((p) => ({ ...p, branchId: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm w-48"
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name || b.code || `Branch ${b.id}`}</option>
                ))}
              </select>
            </div>
          )}
        </motion.div>

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  {loading ? '…' : `LKR ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold">{loading ? '…' : totalOrders}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Order</p>
                <p className="text-2xl font-bold">
                  {loading ? '…' : `LKR ${avgOrder.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Chart: daily revenue (line) */}
        {!loading && profitByDay.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Revenue by day</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitByDay}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                  formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Revenue']}
                  labelFormatter={(label) => label}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Bar chart: revenue by day (alternative view) */}
        {!loading && profitByDay.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm"
          >
            <h2 className="text-xl font-bold mb-4">Daily sales (bars)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={profitByDay}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}
                  formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {!loading && salesSummary.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-6 border border-secondary shadow-sm overflow-x-auto"
          >
            <h2 className="text-lg font-bold mb-3">By branch</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2">Branch</th>
                  <th className="text-right p-2">Sales</th>
                  <th className="text-right p-2">Revenue</th>
                  <th className="text-right p-2">Paid</th>
                  <th className="text-right p-2">Due</th>
                </tr>
              </thead>
              <tbody>
                {salesSummary.map((row) => (
                  <tr key={row.branch_id || row.branch_name} className="border-b border-border/50">
                    <td className="p-2">{row.branch_name || row.branch_code || `#${row.branch_id}`}</td>
                    <td className="p-2 text-right">{row.total_sales}</td>
                    <td className="p-2 text-right">LKR {(parseFloat(row.total_revenue) || 0).toLocaleString()}</td>
                    <td className="p-2 text-right">LKR {(parseFloat(row.total_paid) || 0).toLocaleString()}</td>
                    <td className="p-2 text-right">LKR {(parseFloat(row.total_due) || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {!loading && !error && salesSummary.length === 0 && profitByDay.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No sales data for the selected period.</p>
        )}
      </div>
    </>
  );
};

export default SaleReport;
