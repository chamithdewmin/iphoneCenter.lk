import React from "react";
import ReportLayout from "@/components/ReportLayout";
import StatCard from "@/components/StatCard";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
} from "lucide-react";
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
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
} from "recharts";

const monthlyOverview = [
  { month: "Jul", revenue: 245000, expenses: 182000, profit: 63000 },
  { month: "Aug", revenue: 278000, expenses: 195000, profit: 83000 },
  { month: "Sep", revenue: 260000, expenses: 188000, profit: 72000 },
  { month: "Oct", revenue: 310000, expenses: 210000, profit: 100000 },
  { month: "Nov", revenue: 345000, expenses: 225000, profit: 120000 },
  { month: "Dec", revenue: 398000, expenses: 248000, profit: 150000 },
  { month: "Jan", revenue: 365000, expenses: 235000, profit: 130000 },
  { month: "Feb", revenue: 340000, expenses: 220000, profit: 120000 },
];

const departmentData = [
  { name: "Sales", value: 35 },
  { name: "Operations", value: 25 },
  { name: "Marketing", value: 18 },
  { name: "Support", value: 12 },
  { name: "R&D", value: 10 },
];

const COLORS = [
  "hsl(187,80%,48%)",
  "hsl(260,60%,55%)",
  "hsl(150,60%,45%)",
  "hsl(35,90%,55%)",
  "hsl(340,65%,55%)",
];

const kpiTrends = [
  { month: "Jul", customers: 1420, orders: 2800, products: 340 },
  { month: "Aug", customers: 1520, orders: 3100, products: 355 },
  { month: "Sep", customers: 1480, orders: 2950, products: 348 },
  { month: "Oct", customers: 1650, orders: 3400, products: 370 },
  { month: "Nov", customers: 1780, orders: 3700, products: 385 },
  { month: "Dec", customers: 1920, orders: 4100, products: 402 },
  { month: "Jan", customers: 1850, orders: 3900, products: 395 },
  { month: "Feb", customers: 1842, orders: 3750, products: 390 },
];

const recentActivities = [
  {
    action: "New bulk order received",
    value: "$28,500",
    time: "2 hours ago",
    type: "order",
  },
  {
    action: "Payment processed",
    value: "$12,340",
    time: "3 hours ago",
    type: "payment",
  },
  {
    action: "Stock alert: Widget A",
    value: "Low Stock",
    time: "5 hours ago",
    type: "alert",
  },
  {
    action: "New customer registered",
    value: "Acme Corp",
    time: "6 hours ago",
    type: "customer",
  },
  {
    action: "Supplier invoice received",
    value: "$45,200",
    time: "8 hours ago",
    type: "payment",
  },
  {
    action: "Monthly target achieved",
    value: "112%",
    time: "1 day ago",
    type: "milestone",
  },
];

const OverviewReport = () => (
  <ReportLayout
    title="Overview Report"
    subtitle="Complete business performance at a glance"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Revenue"
        value="$2.54M"
        change="+12.5% from last quarter"
        changeType="up"
        icon={DollarSign}
      />
      <StatCard
        label="Net Profit"
        value="$738K"
        change="+18.2% from last quarter"
        changeType="up"
        icon={TrendingUp}
      />
      <StatCard
        label="Total Orders"
        value="27,700"
        change="+1,420 this month"
        changeType="up"
        icon={ShoppingBag}
      />
      <StatCard
        label="Active Customers"
        value="1,842"
        change="+126 new this month"
        changeType="up"
        icon={Users}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="report-card lg:col-span-2">
        <h3 className="text-foreground font-semibold mb-4">
          Revenue vs Expenses vs Profit
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyOverview}>
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
              dataKey="expenses"
              fill="hsl(260,60%,55%)"
              radius={[4, 4, 0, 0]}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="hsl(150,60%,45%)"
              strokeWidth={2}
              name="Profit"
              dot={{ fill: "hsl(150,60%,45%)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Revenue by Department
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={departmentData}
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              paddingAngle={4}
            >
              {departmentData.map((_, i) => (
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
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2">
          {departmentData.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-1.5"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: COLORS[i] }}
              />
              <span className="text-xs text-muted-foreground">
                {item.name} ({item.value}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          KPI Trends
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={kpiTrends}>
            <defs>
              <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
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
              <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(260,60%,55%)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(260,60%,55%)"
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
              dataKey="customers"
              stroke="hsl(187,80%,48%)"
              fill="url(#custGrad)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="hsl(260,60%,55%)"
              fill="url(#ordGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="report-card">
        <h3 className="text-foreground font-semibold mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivities.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
            >
              <div>
                <p className="text-foreground text-sm font-medium">
                  {a.action}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {a.time}
                </p>
              </div>
              <span
                className={`text-sm font-mono font-medium ${
                  a.type === "alert"
                    ? "text-warning"
                    : "text-foreground"
                }`}
              >
                {a.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </ReportLayout>
);

export default OverviewReport;

