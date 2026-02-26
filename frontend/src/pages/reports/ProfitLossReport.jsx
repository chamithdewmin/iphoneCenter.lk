import React, { useEffect, useMemo, useState } from "react";
import ReportLayout from "@/components/ReportLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { BranchFilter } from "@/components/BranchFilter";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Download,
  RefreshCw,
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { authFetch } from "@/lib/api";
import { getStorageData } from "@/utils/storage";
import { getPrintHtml } from "@/utils/pdfPrint";

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

const COLORS = [
  "hsl(187,80%,48%)",
  "hsl(260,60%,55%)",
  "hsl(150,60%,45%)",
  "hsl(35,90%,55%)",
  "hsl(340,65%,55%)",
];

function downloadCsv(filename, rows) {
  if (!rows || rows.length === 0) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header
        .map((key) => {
          const val = row[key] ?? "";
          const str = typeof val === "number" ? String(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ProfitLossReport = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBranchId } = useBranchFilter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const salesUrl = selectedBranchId
          ? `/api/billing/sales?branchId=${selectedBranchId}&limit=1000`
          : "/api/billing/sales?limit=1000";
        const salesRes = await authFetch(salesUrl);
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
  }, [selectedBranchId, refreshKey]);

  const monthlyPL = useMemo(() => {
    const map = new Map();

    sales.forEach((s) => {
      if (
        selectedBranchId &&
        s.branch_id != null &&
        String(s.branch_id) !== String(selectedBranchId)
      ) {
        return;
      }
      const info = getMonthKeyLabel(s.created_at || s.date);
      if (!info) return;
      const row =
        map.get(info.key) || {
          month: info.label,
          revenue: 0,
          cogs: 0,
          opex: 0,
          profit: 0,
        };
      row.revenue += Number(s.total_amount) || 0;
      map.set(info.key, row);
    });

    purchases.forEach((p) => {
      const info = getMonthKeyLabel(p.date || p.createdAt);
      if (!info) return;
      const row =
        map.get(info.key) || {
          month: info.label,
          revenue: 0,
          cogs: 0,
          opex: 0,
          profit: 0,
        };
      row.cogs += Number(p.total) || 0;
      map.set(info.key, row);
    });

    expenses.forEach((e) => {
      if (
        selectedBranchId &&
        e.branchId != null &&
        String(e.branchId) !== String(selectedBranchId)
      ) {
        return;
      }
      const info = getMonthKeyLabel(e.date || e.createdAt);
      if (!info) return;
      const row =
        map.get(info.key) || {
          month: info.label,
          revenue: 0,
          cogs: 0,
          opex: 0,
          profit: 0,
        };
      row.opex += Number(e.amount) || 0;
      map.set(info.key, row);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => ({
        ...v,
        profit: v.revenue - v.cogs - v.opex,
      }))
      .slice(-8);
  }, [sales, expenses, purchases, selectedBranchId]);

  const marginTrend = useMemo(() => {
    return monthlyPL.map((m) => {
      const revenue = m.revenue || 1;
      const gross = ((m.revenue - m.cogs) / revenue) * 100;
      const net = (m.profit / revenue) * 100;
      return {
        month: m.month,
        gross: Number.isFinite(gross) ? Number(gross.toFixed(1)) : 0,
        net: Number.isFinite(net) ? Number(net.toFixed(1)) : 0,
      };
    });
  }, [monthlyPL]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map();

    expenses.forEach((e) => {
      const cat = e.category || "Other";
      map.set(cat, (map.get(cat) || 0) + (Number(e.amount) || 0));
    });

    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return entries.map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const summary = useMemo(() => {
    if (monthlyPL.length === 0) {
      return null;
    }
    const last = monthlyPL[monthlyPL.length - 1];
    const prev =
      monthlyPL.length > 1 ? monthlyPL[monthlyPL.length - 2] : null;

    const changePct = (curr, prevVal) => {
      if (!prevVal) return "0.0%";
      if (prevVal === 0) return "0.0%";
      const diff = ((curr - prevVal) / prevVal) * 100;
      return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    };

    return {
      netRevenue: last.revenue,
      grossProfit: last.revenue - last.cogs,
      opex: last.opex,
      netProfit: last.profit,
      netRevenueChange: changePct(last.revenue, prev?.revenue ?? null),
      opexChange: changePct(last.opex, prev?.opex ?? null),
      grossMargin:
        last.revenue > 0
          ? (((last.revenue - last.cogs) / last.revenue) * 100).toFixed(1)
          : "0.0",
      netMargin:
        last.revenue > 0
          ? ((last.profit / last.revenue) * 100).toFixed(1)
          : "0.0",
      prev,
      last,
    };
  }, [monthlyPL]);

  const plSummary = useMemo(() => {
    if (!summary || !summary.prev) return [];
    const prev = summary.prev;
    const last = summary.last;

    const changePct = (curr, prevVal) => {
      if (!prevVal) return "0.0%";
      if (prevVal === 0) return "0.0%";
      const diff = ((curr - prevVal) / prevVal) * 100;
      return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
    };

    return [
      {
        item: "Gross Revenue",
        current: `LKR ${last.revenue.toLocaleString()}`,
        previous: `LKR ${prev.revenue.toLocaleString()}`,
        change: changePct(last.revenue, prev.revenue),
      },
      {
        item: "Cost of Goods Sold",
        current: `LKR ${last.cogs.toLocaleString()}`,
        previous: `LKR ${prev.cogs.toLocaleString()}`,
        change: changePct(last.cogs, prev.cogs),
      },
      {
        item: "Gross Profit",
        current: `LKR ${(last.revenue - last.cogs).toLocaleString()}`,
        previous: `LKR ${(prev.revenue - prev.cogs).toLocaleString()}`,
        change: changePct(
          last.revenue - last.cogs,
          prev.revenue - prev.cogs,
        ),
      },
      {
        item: "Operating Expenses",
        current: `LKR ${last.opex.toLocaleString()}`,
        previous: `LKR ${prev.opex.toLocaleString()}`,
        change: changePct(last.opex, prev.opex),
      },
      {
        item: "Net Profit",
        current: `LKR ${last.profit.toLocaleString()}`,
        previous: `LKR ${prev.profit.toLocaleString()}`,
        change: changePct(last.profit, prev.profit),
      },
    ];
  }, [summary]);

  const netMarginValue = summary ? Number(summary.netMargin) : 0;

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExportCsv = () => {
    downloadCsv("profit-loss-report.csv", monthlyPL);
  };

  const handleDownloadPdf = () => {
    const rowsHtml = monthlyPL
      .map(
        (row) => `
        <tr>
          <td>${row.month}</td>
          <td>${row.revenue}</td>
          <td>${row.cogs}</td>
          <td>${row.opex}</td>
          <td>${row.profit}</td>
        </tr>`,
      )
      .join("");

    const bodyHtml = `
      <h2>Profit &amp; Loss Report</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #1f2937;">Month</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Revenue</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">COGS</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Opex</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #1f2937;">Profit</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    const html = getPrintHtml(bodyHtml, {
      businessName: "Profit & Loss Report",
    });
    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  return (
    <ReportLayout
      title="Profit & Loss Report"
      subtitle="Comprehensive income statement analysis and margin tracking"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <BranchFilter id="pl-branch" />
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleDownloadPdf}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Net Revenue"
          value={
            loading || !summary
              ? "Loading..."
              : `LKR ${summary.netRevenue.toLocaleString()}`
          }
          change={
            summary ? `${summary.netRevenueChange} from last month` : ""
          }
          changeType={
            summary && summary.netRevenueChange.startsWith("-")
              ? "down"
              : "up"
          }
          icon={DollarSign}
        />
        <StatCard
          label="Gross Profit"
          value={
            loading || !summary
              ? "Loading..."
              : `LKR ${summary.grossProfit.toLocaleString()}`
          }
          change={
            summary ? `${summary.grossMargin}% gross margin` : ""
          }
          changeType="up"
          icon={TrendingUp}
        />
        <StatCard
          label="Operating Expenses"
          value={
            loading || !summary
              ? "Loading..."
              : `LKR ${summary.opex.toLocaleString()}`
          }
          change={
            summary ? `${summary.opexChange} from last month` : ""
          }
          changeType="down"
          icon={TrendingDown}
        />
        <StatCard
          label="Net Profit Margin"
          value={
            loading || !summary ? "Loading..." : `${summary.netMargin}%`
          }
          change=""
          changeType={netMarginValue >= 0 ? "up" : "down"}
          icon={Percent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="report-card lg:col-span-2">
          <h3 className="text-foreground font-semibold mb-4">
            Revenue, COGS & Profit Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyPL}>
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
                dataKey="revenue"
                fill="hsl(187,80%,48%)"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
              <Bar
                dataKey="cogs"
                fill="hsl(260,60%,55%)"
                radius={[4, 4, 0, 0]}
                name="COGS"
              />
              <Bar
                dataKey="profit"
                fill="hsl(150,60%,45%)"
                radius={[4, 4, 0, 0]}
                name="Net Profit"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Expense Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={4}
              >
                {expenseBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(225,21%,7.5%)",
                  border: "1px solid hsl(225,15%,15%)",
                  borderRadius: "8px",
                  color: "hsl(210,20%,90%)",
                }}
                formatter={(v) =>
                  `LKR ${(Number(v) || 0).toLocaleString()}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {expenseBreakdown.map((item, i) => (
              <div
                key={item.name}
                className="flex items-center gap-1.5"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            Margin Trends (%)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={marginTrend}>
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(187,80%,48%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(187,80%,48%)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(150,60%,45%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(150,60%,45%)"
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
                unit="%"
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
              <Area
                type="monotone"
                dataKey="gross"
                stroke="hsl(187,80%,48%)"
                fill="url(#grossGrad)"
                strokeWidth={2}
                name="Gross Margin"
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="hsl(150,60%,45%)"
                fill="url(#netGrad)"
                strokeWidth={2}
                name="Net Margin"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <h3 className="text-foreground font-semibold mb-4">
            P&L Summary (Current vs Previous)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                    Item
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                    Current
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                    Previous
                  </th>
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {plSummary.map((row) => (
                  <tr
                    key={row.item}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-2 text-foreground font-medium">
                      {row.item}
                    </td>
                    <td className="py-3 px-2 font-mono text-foreground">
                      {row.current}
                    </td>
                    <td className="py-3 px-2 font-mono text-muted-foreground">
                      {row.previous}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={
                          row.change.startsWith("-")
                            ? row.item.includes("Expense") ||
                              row.item.includes("Cost")
                              ? "text-success"
                              : "text-destructive"
                            : "text-success"
                        }
                      >
                        {row.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ReportLayout>
  );
};

export default ProfitLossReport;

