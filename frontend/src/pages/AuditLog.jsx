import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { ClipboardList, RefreshCw, Filter } from 'lucide-react';
import { authFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    action: '',
    limit: '100',
  });

  const loadActions = useCallback(async () => {
    const res = await authFetch('/api/audit-logs/actions');
    if (res.ok && res.data?.data) setActions(res.data.data);
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.action) params.set('action', filters.action);
    if (filters.limit) params.set('limit', filters.limit);
    const res = await authFetch(`/api/audit-logs?${params.toString()}`);
    if (!res.ok) {
      setError(res.data?.message || 'Failed to load audit logs');
      setLogs([]);
    } else {
      setLogs(Array.isArray(res.data?.data) ? res.data.data : []);
    }
    setLoading(false);
  }, [filters.dateFrom, filters.dateTo, filters.action, filters.limit]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
  };

  const summary = (obj) => {
    if (obj == null) return '—';
    if (typeof obj !== 'object') return String(obj);
    const keys = Object.keys(obj).slice(0, 3);
    return keys.map((k) => `${k}: ${obj[k]}`).join(', ') || '—';
  };

  return (
    <>
      <Helmet>
        <title>Audit Log - iphone center.lk</title>
        <meta name="description" content="View system audit log (admin only)" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="w-8 h-8" />
              Audit Log
            </h1>
            <p className="text-muted-foreground mt-1">Who did what and when (admin only)</p>
          </div>
          <Button onClick={loadLogs} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-end gap-3"
        >
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters((p) => ({ ...p, action: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm w-40"
              >
                <option value="">All</option>
                {actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Limit</label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters((p) => ({ ...p, limit: e.target.value }))}
                className="h-9 px-3 rounded-md border border-input bg-background text-sm w-24"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading audit log...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No audit entries match the filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Action</th>
                    <th className="text-left p-3 font-medium">Entity</th>
                    <th className="text-left p-3 font-medium">Details</th>
                    <th className="text-left p-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDate(row.created_at)}</td>
                      <td className="p-3">{row.username || `#${row.user_id}`}</td>
                      <td className="p-3 font-medium">{row.action}</td>
                      <td className="p-3">{row.entity_type && row.entity_id ? `${row.entity_type} #${row.entity_id}` : row.entity_type || '—'}</td>
                      <td className="p-3 max-w-xs truncate" title={JSON.stringify(row.new_values || row.old_values)}>
                        {summary(row.new_values) || summary(row.old_values)}
                      </td>
                      <td className="p-3 text-muted-foreground">{row.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default AuditLog;
