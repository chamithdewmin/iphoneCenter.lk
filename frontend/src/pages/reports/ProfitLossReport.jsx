import React from "react";
import ReportLayout from "@/components/ReportLayout";
import StatCard from "@/components/StatCard";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";
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

const monthlyPL = [
  { month: "Jul", revenue: 245000, cogs: 112000, opex: 70000, profit: 63000 },
  { month: "Aug", revenue: 278000, cogs: 125000, opex: 70000, profit: 83000 },
  { month: "Sep", revenue: 260000, cogs: 118000, opex: 70000, profit: 72000 },
  { month: "Oct", revenue: 310000, cogs: 135000, opex: 75000, profit: 100000 },
  { month: "Nov", revenue: 345000, cogs: 145000, opex: 80000, profit: 120000 },
  { month: "Dec", revenue: 398000, cogs: 158000, opex: 90000, profit: 150000 },
  { month: "Jan", revenue: 365000, cogs: 150000, opex: 85000, profit: 130000 },
  { month: "Feb", revenue: 340000, cogs: 142000, opex: 78000, profit: 120000 },
];

const marginTrend = [
  { month: "Jul", gross: 54.3, operating: 25.7, net: 22.1 },
  { month: "Aug", gross: 55.0, operating: 29.9, net: 26.2 },
  { month: "Sep", gross: 54.6, operating: 27.7, net: 24.0 },
  { month: "Oct", gross: 56.5, operating: 32.3, net: 28.8 },
  { month: "Nov", gross: 58.0, operating: 34.8, net: 31.2 },
  { month: "Dec", gross: 60.3, operating: 37.7, net: 34.5 },
  { month: "Jan", gross: 58.9, operating: 35.6, net: 32.0 },
  { month: "Feb", gross: 58.2, operating: 35.3, net: 31.5 },
];

const expenseBreakdown = [
  { name: "COGS", value: 142000 },
  { name: "Salaries", value: 38000 },
  { name: "Marketing", value: 18000 },
  { name: "Operations", value: 14000 },
  { name: "Others", value: 8000 },
];

const COLORS = [
  "hsl(187,80%,48%)",
  "hsl(260,60%,55%)",
  "hsl(150,60%,45%)",
  "hsl(35,90%,55%)",
  "hsl(340,65%,55%)",
];

const plSummary = [
  { item: "Gross Revenue", current: "$340,000", previous: "$365,000", change: "-6.8%" },
  { item: "Cost of Goods Sold", current: "$142,000", previous: "$150,000", change: "-5.3%" },
  { item: "Gross Profit", current: "$198,000", previous: "$215,000", change: "-7.9%" },
  { item: "Operating Expenses", current: "$78,000", previous: "$85,000", change: "-8.2%" },
  { item: "Net Profit", current: "$120,000", previous: "$130,000", change: "-7.7%" },
];

const ProfitLossReport = () => (
  <ReportLayout
    title="Profit & Loss Report"
    subtitle="Comprehensive income statement analysis and margin tracking"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Net Revenue"
        value="$340K"
        change="-6.8% from last month"
        changeType="down"
        icon={DollarSign}
      />
      <StatCard
        label="Gross Profit"
        value="$198K"
        change="58.2% margin"
        changeType="up"
        icon={TrendingUp}
      />
      <StatCard
        label="Operating Expenses"
        value="$78K"
        change="-8.2% from last month"
        changeType="up"
        icon={TrendingDown}
      />
      <StatCard
        label="Net Profit Margin"
        value="35.3%"
        change="+0.1% from last month"
        changeType="up"
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
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(225,21%,7.5%)",
                border: "1px solid hsl(225,15%,15%)",
                borderRadius: "8px",
                color: "hsl(210,20%,90%)",
              }}
              formatter={(v) => `$${(Number(v) / 1000).toFixed(0)}K`}
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
                style={{ background: COLORS[i] }}
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

export default ProfitLossReport;

