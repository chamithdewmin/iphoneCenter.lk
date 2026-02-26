import React from 'react';
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

const monthlyExpenses = [
  { month: 'Jul', amount: 32000 },
  { month: 'Aug', amount: 28000 },
  { month: 'Sep', amount: 35000 },
  { month: 'Oct', amount: 30000 },
  { month: 'Nov', amount: 38000 },
  { month: 'Dec', amount: 42000 },
  { month: 'Jan', amount: 36000 },
  { month: 'Feb', amount: 33000 },
];

const categoryBreakdown = [
  { name: 'Salaries', value: 40 },
  { name: 'Operations', value: 25 },
  { name: 'Marketing', value: 15 },
  { name: 'Utilities', value: 12 },
  { name: 'Other', value: 8 },
];

const COLORS = [
  'hsl(187,80%,48%)',
  'hsl(260,60%,55%)',
  'hsl(150,60%,45%)',
  'hsl(35,90%,55%)',
  'hsl(340,65%,55%)',
];

const expenses = [
  {
    id: 'EXP-401',
    category: 'Salaries',
    description: 'Monthly payroll',
    amount: '$45,200',
    date: 'Feb 25',
    approvedBy: 'Admin',
  },
  {
    id: 'EXP-400',
    category: 'Marketing',
    description: 'Digital ads campaign',
    amount: '$8,500',
    date: 'Feb 23',
    approvedBy: 'Marketing Mgr',
  },
  {
    id: 'EXP-399',
    category: 'Operations',
    description: 'Equipment maintenance',
    amount: '$3,200',
    date: 'Feb 22',
    approvedBy: 'Operations Mgr',
  },
  {
    id: 'EXP-398',
    category: 'Utilities',
    description: 'Electricity & water',
    amount: '$4,100',
    date: 'Feb 20',
    approvedBy: 'Admin',
  },
  {
    id: 'EXP-397',
    category: 'Other',
    description: 'Office supplies',
    amount: '$1,800',
    date: 'Feb 18',
    approvedBy: 'Admin',
  },
];

const ExpenseReport = () => (
  <ReportLayout
    title="Expense Report"
    subtitle="Track all business expenses and cost analysis"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Expenses"
        value="$274,000"
        change="-8.3% from last month"
        changeType="up"
        icon={DollarSign}
      />
      <StatCard
        label="Monthly Avg."
        value="$34,250"
        change="Within budget"
        changeType="up"
        icon={Receipt}
      />
      <StatCard
        label="Largest Category"
        value="Salaries"
        change="40% of total"
        changeType="neutral"
        icon={PieIcon}
      />
      <StatCard
        label="Cost Reduction"
        value="8.3%"
        change="Compared to Q3"
        changeType="up"
        icon={TrendingDown}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="report-card lg:col-span-2">
        <h3 className="text-foreground font-semibold mb-4">Monthly Expense Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={monthlyExpenses}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,15%)" />
            <XAxis dataKey="month" stroke="hsl(215,15%,55%)" fontSize={12} />
            <YAxis stroke="hsl(215,15%,55%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: 'hsl(225,21%,7.5%)',
                border: '1px solid hsl(225,15%,15%)',
                borderRadius: '8px',
                color: 'hsl(210,20%,90%)',
              }}
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
        <h3 className="text-foreground font-semibold mb-4">Expense Breakdown</h3>
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
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(225,21%,7.5%)',
                border: '1px solid hsl(225,15%,15%)',
                borderRadius: '8px',
                color: 'hsl(210,20%,90%)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2">
          {categoryBreakdown.map((item, i) => (
            <div key={item.name} className="flex items-center gap-1.5">
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

    <div className="report-card">
      <h3 className="text-foreground font-semibold mb-4">Recent Expenses</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">ID</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Category</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Description</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Amount</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Approved By</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 font-mono text-primary">{e.id}</td>
                <td className="py-3 px-2 text-foreground">{e.category}</td>
                <td className="py-3 px-2 text-muted-foreground">{e.description}</td>
                <td className="py-3 px-2 text-foreground font-medium">{e.amount}</td>
                <td className="py-3 px-2 text-muted-foreground">{e.date}</td>
                <td className="py-3 px-2 text-muted-foreground">{e.approvedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </ReportLayout>
);

export default ExpenseReport;
