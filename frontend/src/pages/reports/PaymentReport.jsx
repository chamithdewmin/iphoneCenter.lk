import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { authFetch } from '@/lib/api';

const COLORS = [
  'hsl(187,80%,48%)',
  'hsl(260,60%,55%)',
  'hsl(150,60%,45%)',
  'hsl(35,90%,55%)',
];

const PaymentReport = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await authFetch('/api/billing/sales?limit=1000');
      const list = res.ok && Array.isArray(res.data?.data) ? res.data.data : [];
      setSales(list);
      setLoading(false);
    })();
  }, []);

  const {
    totalReceived,
    completedCount,
    pendingAmount,
    overdueAmount,
  } = useMemo(() => {
    let totalReceived = 0;
    let completedCount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    const now = new Date();

    for (const s of sales) {
      const total = Number(s.total_amount) || 0;
      const paid = Number(s.paid_amount) || 0;
      const due = Number(s.due_amount) || 0;
      const status = (s.payment_status || '').toLowerCase();
      totalReceived += paid;
      if (status === 'paid') completedCount += 1;
      if (due > 0) {
        const created = s.created_at ? new Date(s.created_at) : null;
        const days =
          created && !Number.isNaN(created.getTime())
            ? (now - created) / 86400000
            : 0;
        if (days > 30) overdueAmount += due;
        else pendingAmount += due;
      }
    }

    return { totalReceived, completedCount, pendingAmount, overdueAmount };
  }, [sales]);

  const paymentTrends = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => {
      const raw = s.created_at;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      if (!map.has(key)) {
        map.set(key, { month: label, received: 0, pending: 0 });
      }
      const row = map.get(key);
      row.received += Number(s.paid_amount) || 0;
      row.pending += Number(s.due_amount) || 0;
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v)
      .slice(-8);
  }, [sales]);

  const methodData = useMemo(() => {
    const counts = { paid: 0, partial: 0, due: 0 };
    sales.forEach((s) => {
      const status = (s.payment_status || '').toLowerCase();
      if (status === 'paid') counts.paid += 1;
      else if (status === 'partial') counts.partial += 1;
      else if (status === 'due') counts.due += 1;
    });
    const data = [
      { name: 'Paid', value: counts.paid },
      { name: 'Partial', value: counts.partial },
      { name: 'Due', value: counts.due },
    ];
    return data.filter((d) => d.value > 0);
  }, [sales]);

  const transactions = useMemo(
    () =>
      [...sales]
        .sort(
          (a, b) =>
            new Date(b.created_at || 0) - new Date(a.created_at || 0),
        )
        .slice(0, 20)
        .map((s) => ({
          id: s.invoice_number || `#${s.id}`,
          customer: s.customer_name || 'Walk-in',
          amount: `LKR ${(Number(s.total_amount) || 0).toLocaleString()}`,
          method: (s.payment_status || '').toUpperCase(),
          date: s.created_at
            ? new Date(s.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'N/A',
          status:
            (s.payment_status || '').toLowerCase() === 'paid'
              ? 'Completed'
              : (s.payment_status || '').toLowerCase() === 'partial'
              ? 'Pending'
              : 'Due',
        })),
    [sales],
  );

  return (
    <ReportLayout
      title="Payment Report"
      subtitle="Monitor payment flows and transaction history"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Received"
          value={
            loading ? '…' : `LKR ${totalReceived.toLocaleString()}`
          }
          change=""
          changeType="up"
          icon={CreditCard}
        />
        <StatCard
          label="Completed"
          value={loading ? '…' : completedCount.toString()}
          change=""
          changeType="up"
          icon={CheckCircle}
        />
        <StatCard
          label="Pending"
          value={
            loading ? '…' : `LKR ${pendingAmount.toLocaleString()}`
          }
          change=""
          changeType="neutral"
          icon={Clock}
        />
        <StatCard
          label="Overdue"
          value={
            loading ? '…' : `LKR ${overdueAmount.toLocaleString()}`
          }
          change=""
          changeType="down"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Payment Trends
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={paymentTrends}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                dataKey="month"
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(215,15%,55%)"
                fontSize={12}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(225,21%,7.5%)',
                  border: '1px solid hsl(225,15%,15%)',
                  borderRadius: '8px',
                  color: 'hsl(210,20%,90%)',
                }}
                formatter={(value, name) => [
                  `LKR ${Number(value).toLocaleString()}`,
                  name === 'received' ? 'Received' : 'Pending',
                ]}
              />
              <Area
                type="monotone"
                dataKey="received"
                stackId="1"
                stroke="hsl(187,80%,48%)"
                fill="hsl(187,80%,48%)"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="pending"
                stackId="1"
                stroke="hsl(35,90%,55%)"
                fill="hsl(35,90%,55%)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Payments by Status
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={methodData}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {methodData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(225,21%,7.5%)',
                  border: '1px solid hsl(225,15%,15%)',
                  borderRadius: '8px',
                  color: 'hsl(210,20%,90%)',
                }}
                formatter={(value, name) => [`${value} payments`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {methodData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Recent Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  TXN ID
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Customer
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Amount
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Status
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 font-mono text-primary">
                    {t.id}
                  </td>
                  <td className="py-3 px-2 text-foreground">
                    {t.customer}
                  </td>
                  <td className="py-3 px-2 text-foreground font-medium">
                    {t.amount}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === 'Completed'
                          ? 'bg-success/10 text-success'
                          : t.status === 'Pending'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {t.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  );
};

export default PaymentReport;
