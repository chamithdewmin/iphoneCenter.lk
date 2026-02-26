import React, { useEffect, useMemo, useState } from 'react';
import ReportLayout from '@/components/ReportLayout';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingDown, Receipt, PieChart as PieIcon } from 'lucide-react';
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
import { getStorageData } from '@/utils/storage';

const COLORS = [
  'hsl(187,80%,48%)',
  'hsl(260,60%,55%)',
  'hsl(150,60%,45%)',
  'hsl(35,90%,55%)',
  'hsl(340,65%,55%)',
];

const ExpenseReport = () => {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const loaded = getStorageData('expenses', []);
    setExpenses(Array.isArray(loaded) ? loaded : []);
  }, []);

  const { total, avgMonthly, topCategory } = useMemo(() => {
    let total = 0;
    const byMonth = new Map();
    const byCategory = new Map();

    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0;
      total += amount;
      const raw = e.date || e.createdAt;
      const d = raw ? new Date(raw) : null;
      const key =
        d && !Number.isNaN(d.getTime())
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : 'unknown';
      byMonth.set(key, (byMonth.get(key) || 0) + amount);

      const cat = e.category || 'Other';
      byCategory.set(cat, (byCategory.get(cat) || 0) + amount);
    });

    const months = byMonth.size || 1;
    let topCategory = '—';
    let maxVal = 0;
    byCategory.forEach((val, key) => {
      if (val > maxVal) {
        maxVal = val;
        topCategory = key;
      }
    });

    return {
      total,
      avgMonthly: months > 0 ? total / months : 0,
      topCategory,
    };
  }, [expenses]);

  const monthlyExpenses = useMemo(() => {
    const map = new Map();
    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0;
      const raw = e.date || e.createdAt;
      const d = raw ? new Date(raw) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      if (!map.has(key)) {
        map.set(key, { month: label, amount: 0 });
      }
      const row = map.get(key);
      row.amount += amount;
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v)
      .slice(-8);
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    let total = 0;
    expenses.forEach((e) => {
      const amount = Number(e.amount) || 0;
      total += amount;
      const cat = e.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + amount);
    });
    if (!total) return [];
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({
        name,
        value: Math.round((value / total) * 100),
      }));
  }, [expenses]);

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .sort(
          (a, b) =>
            new Date(b.date || b.createdAt || 0) -
            new Date(a.date || a.createdAt || 0),
        )
        .slice(0, 20)
        .map((e, idx) => ({
          id: e.id || `EXP-${idx + 1}`,
          category: e.category || 'Other',
          description: e.description || '',
          amount: `LKR ${(Number(e.amount) || 0).toLocaleString()}`,
          date: e.date
            ? new Date(e.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'N/A',
          approvedBy: e.approvedBy || '',
        })),
    [expenses],
  );

  return (
    <ReportLayout
      title="Expense Report"
      subtitle="Track all business expenses and cost analysis"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Expenses"
          value={`LKR ${total.toLocaleString()}`}
          change=""
          changeType="up"
          icon={DollarSign}
        />
        <StatCard
          label="Monthly Avg."
          value={`LKR ${avgMonthly.toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}`}
          change=""
          changeType="neutral"
          icon={Receipt}
        />
        <StatCard
          label="Largest Category"
          value={topCategory}
          change=""
          changeType="neutral"
          icon={PieIcon}
        />
        <StatCard
          label="Records"
          value={expenses.length.toString()}
          change=""
          changeType="up"
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Monthly Expense Trend
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyExpenses}>
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
                formatter={(value) => [
                  `LKR ${Number(value).toLocaleString()}`,
                  'Amount',
                ]}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(340,65%,55%)"
                fill="hsl(340,65%,55%)"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Expense Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryBreakdown}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={3}
              >
                {categoryBreakdown.map((_, i) => (
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
                formatter={(value, name) => [`${value}%`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {categoryBreakdown.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Recent Expenses
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  ID
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Category
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Description
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Amount
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Date
                </th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                  Approved By
                </th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-2 font-mono text-primary">{e.id}</td>
                  <td className="py-3 px-2 text-foreground">{e.category}</td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {e.description}
                  </td>
                  <td className="py-3 px-2 text-foreground font-medium">
                    {e.amount}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{e.date}</td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {e.approvedBy}
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

export default ExpenseReport;
