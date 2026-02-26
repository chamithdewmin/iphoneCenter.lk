import React from "react";
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

const monthlyCashFlow = [
  { month: "Jul", inflow: 258000, outflow: 195000, net: 63000 },
  { month: "Aug", inflow: 295000, outflow: 208000, net: 87000 },
  { month: "Sep", inflow: 270000, outflow: 202000, net: 68000 },
  { month: "Oct", inflow: 325000, outflow: 228000, net: 97000 },
  { month: "Nov", inflow: 360000, outflow: 242000, net: 118000 },
  { month: "Dec", inflow: 412000, outflow: 268000, net: 144000 },
  { month: "Jan", inflow: 380000, outflow: 255000, net: 125000 },
  { month: "Feb", inflow: 355000, outflow: 240000, net: 115000 },
];

const cashBalance = [
  { month: "Jul", balance: 420000 },
  { month: "Aug", balance: 507000 },
  { month: "Sep", balance: 575000 },
  { month: "Oct", balance: 672000 },
  { month: "Nov", balance: 790000 },
  { month: "Dec", balance: 934000 },
  { month: "Jan", balance: 1059000 },
  { month: "Feb", balance: 1174000 },
];

const cashCategories = [
  { category: "Sales Receipts", inflow: 285000, outflow: 0 },
  { category: "Supplier Payments", inflow: 0, outflow: 142000 },
  { category: "Payroll", inflow: 0, outflow: 48000 },
  { category: "Operating Costs", inflow: 0, outflow: 28000 },
  { category: "Loan Repayment", inflow: 0, outflow: 12000 },
  { category: "Other Income", inflow: 70000, outflow: 0 },
  { category: "Tax Payments", inflow: 0, outflow: 10000 },
];

const cashFlowDetails = [
  { item: "Operating Cash Flow", value: "$115,000", status: "positive" },
  { item: "Investing Cash Flow", value: "-$22,000", status: "negative" },
  { item: "Financing Cash Flow", value: "-$8,000", status: "negative" },
  { item: "Net Cash Flow", value: "$85,000", status: "positive" },
  { item: "Opening Balance", value: "$1,089,000", status: "neutral" },
  { item: "Closing Balance", value: "$1,174,000", status: "positive" },
];

const CashFlowReport = () => (
  <ReportLayout
    title="Cash Flow Report"
    subtitle="Track cash inflows, outflows, and liquidity position"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Cash Balance"
        value="$1.17M"
        change="+10.9% from last month"
        changeType="up"
        icon={Wallet}
      />
      <StatCard
        label="Total Inflow"
        value="$355K"
        change="-6.6% from last month"
        changeType="down"
        icon={ArrowUpRight}
      />
      <StatCard
        label="Total Outflow"
        value="$240K"
        change="-5.9% from last month"
        changeType="up"
        icon={ArrowDownRight}
      />
      <StatCard
        label="Net Cash Flow"
        value="$115K"
        change="-8.0% from last month"
        changeType="down"
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
          <BarChart data={cashCategories} layout="vertical">
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
              width={120}
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

export default CashFlowReport;

