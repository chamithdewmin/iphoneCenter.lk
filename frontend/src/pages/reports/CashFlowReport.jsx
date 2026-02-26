import React, { useEffect, useMemo, useState } from "react";
import ReportLayout from "@/components/ReportLayout";
import StatCard from "@/components/StatCard";
import { Banknote, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { authFetch } from "@/lib/api";
import { getStorageData } from "@/utils/storage";

function getMonthKeyLabel(raw) {
  const d = raw ? new Date(raw) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const label = d.toLocaleDateString("en-US", { month: "short" });
  return { key, label };
}

const CashFlowReport = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const salesRes = await authFetch("/api/billing/sales?limit=1000");
        if (!cancelled) {
          const salesData =
            salesRes.ok && Array.isArray(salesRes.data?.data)
              ? salesRes.data.data
              : [];
          setSales(salesData);

          const loadedExpenses = getStorageData("expenses", []);
          setExpenses(Array.isArray(loadedExpenses) ? loadedExpenses : []);
          const loadedPurchases = getStorageData("purchases", []);
          setPurchases(Array.isArray(loadedPurchases) ? loadedPurchases : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyCashFlow = useMemo(() => {
    const map = new Map();

    sales.forEach((s) => {
      const info = getMonthKeyLabel(s.created_at || s.date);
      if (!info) return;
      const row =
        map.get(info.key) || {
          month: info.label,
          inflow: 0,
          outflow: 0,
          net: 0,
        };
      row.inflow += Number(s.paid_amount ?? s.total_amount) || 0;
      map.set(info.key, row);
    });

    expenses.forEach((e) => {
      const info = getMonthKeyLabel(e.date || e.createdAt);
      if (!info) return;
      const row =
        map.get(info.key) || {
          month: info.label,
          inflow: 0,
          outflow: 0,
          net: 0,
        };
      row.outflow += Number(e.amount) || 0;
      map.set(info.key, row);
    });

    purchases.forEach((p) => {
      const info = getMonthKeyLabel(p.date || p.createdAt);
      if (!info) return;
      const row =
        map.get(info.key) || {
          month: info.label,
          inflow: 0,
          outflow: 0,
          net: 0,
        };
      row.outflow += Number(p.total) || 0;
      map.set(info.key, row);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => ({
        ...v,
        net: v.inflow - v.outflow,
      }))
      .slice(-8);
  }, [sales, expenses, purchases]);

  const cashBalance = useMemo(() => {
    const result = [];
    let running = 0;
    monthlyCashFlow.forEach((m) => {
      running += m.net;
      result.push({ month: m.month, balance: running });
    });
    return result;
  }, [monthlyCashFlow]);

  const categories = useMemo(() => {
    const inflow = sales.reduce(
      (sum, s) => sum + (Number(s.paid_amount ?? s.total_amount) || 0),
      0,
    );
    const purchasesOut = purchases.reduce(
      (sum, p) => sum + (Number(p.total) || 0),
      0,
    );
    const expensesOut = expenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0,
    );
    return [
      { category: "Sales Receipts", inflow, outflow: 0 },
      { category: "Purchases", inflow: 0, outflow: purchasesOut },
      { category: "Operating Expenses", inflow: 0, outflow: expensesOut },
    ];
  }, [sales, purchases, expenses]);

  const summary = useMemo(() => {
    const totalInflow = monthlyCashFlow.reduce(
      (sum, m) => sum + m.inflow,
      0,
    );
    const totalOutflow = monthlyCashFlow.reduce(
      (sum, m) => sum + m.outflow,
      0,
    );
    const net = totalInflow - totalOutflow;
    const opening = 0;
    const closing = opening + net;
    return { totalInflow, totalOutflow, net, opening, closing };
  }, [monthlyCashFlow]);

  const cashFlowDetails = useMemo(
    () => [
      {
        item: "Operating Cash Flow",
        value: `LKR ${summary.net.toLocaleString()}`,
        status: summary.net >= 0 ? "positive" : "negative",
      },
      {
        item: "Net Cash Flow",
        value: `LKR ${summary.net.toLocaleString()}`,
        status: summary.net >= 0 ? "positive" : "negative",
      },
      {
        item: "Opening Balance",
        value: `LKR ${summary.opening.toLocaleString()}`,
        status: "neutral",
      },
      {
        item: "Closing Balance",
        value: `LKR ${summary.closing.toLocaleString()}`,
        status: summary.closing >= 0 ? "positive" : "negative",
      },
    ],
    [summary],
  );

  return (
    <ReportLayout
      title="Cash Flow Report"
      subtitle="Track cash inflows, outflows, and liquidity position"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Cash Balance"
          value={
            loading
              ? "Loading..."
              : `LKR ${summary.closing.toLocaleString()}`
          }
          change=""
          changeType="up"
          icon={Wallet}
        />
        <StatCard
          label="Total Inflow"
          value={
            loading
              ? "Loading..."
              : `LKR ${summary.totalInflow.toLocaleString()}`
          }
          change=""
          changeType="up"
          icon={ArrowUpRight}
        />
        <StatCard
          label="Total Outflow"
          value={
            loading
              ? "Loading..."
              : `LKR ${summary.totalOutflow.toLocaleString()}`
          }
          change=""
          changeType="down"
          icon={ArrowDownRight}
        />
        <StatCard
          label="Net Cash Flow"
          value={
            loading
              ? "Loading..."
              : `LKR ${summary.net.toLocaleString()}`
          }
          change=""
          changeType={summary.net >= 0 ? "up" : "down"}
          icon={Banknote}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Cash Inflow vs Outflow
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyCashFlow}>
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
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(225,21%,7.5%)",
                  border: "1px solid hsl(225,15%,15%)",
                  borderRadius: "8px",
                  color: "hsl(210,20%,90%)",
                }}
              />
              <Legend />
              <Bar
                dataKey="inflow"
                fill="hsl(150,60%,45%)"
                radius={[4, 4, 0, 0]}
                name="Inflow"
              />
              <Bar
                dataKey="outflow"
                fill="hsl(0,70%,50%)"
                radius={[4, 4, 0, 0]}
                name="Outflow"
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="hsl(187,80%,48%)"
                strokeWidth={2}
                name="Net Cash"
                dot={{ fill: "hsl(187,80%,48%)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Cash Balance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={cashBalance}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(187,80%,48%)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(187,80%,48%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
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
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(225,21%,7.5%)",
                  border: "1px solid hsl(225,15%,15%)",
                  borderRadius: "8px",
                  color: "hsl(210,20%,90%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(187,80%,48%)"
                fill="url(#balGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Cash Flow by Category
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categories} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(225,15%,15%)"
              />
              <XAxis
                type="number"
                stroke="hsl(215,15%,55%)"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="hsl(215,15%,55%)"
                fontSize={11}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(225,21%,7.5%)",
                  border: "1px solid hsl(225,15%,15%)",
                  borderRadius: "8px",
                  color: "hsl(210,20%,90%)",
                }}
              />
              <Legend />
              <Bar
                dataKey="inflow"
                fill="hsl(150,60%,45%)"
                radius={[0, 4, 4, 0]}
                name="Inflow"
              />
              <Bar
                dataKey="outflow"
                fill="hsl(0,70%,50%)"
                radius={[0, 4, 4, 0]}
                name="Outflow"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Cash Flow Statement Summary
          </h3>
          <div className="space-y-1">
            {cashFlowDetails.map((row) => (
              <div
                key={row.item}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <span className="text-foreground text-sm font-medium">
                  {row.item}
                </span>
                <span
                  className={`font-mono font-semibold text-sm ${
                    row.status === "positive"
                      ? "text-success"
                      : row.status === "negative"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default CashFlowReport;

