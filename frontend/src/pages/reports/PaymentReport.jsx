import React from 'react';
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

const paymentTrends = [
  { month: 'Jul', received: 38000, pending: 12000 },
  { month: 'Aug', received: 45000, pending: 8000 },
  { month: 'Sep', received: 42000, pending: 15000 },
  { month: 'Oct', received: 55000, pending: 10000 },
  { month: 'Nov', received: 48000, pending: 18000 },
  { month: 'Dec', received: 62000, pending: 9000 },
  { month: 'Jan', received: 58000, pending: 14000 },
  { month: 'Feb', received: 65000, pending: 11000 },
];

const methodData = [
  { name: 'Bank Transfer', value: 45 },
  { name: 'Credit Card', value: 25 },
  { name: 'Cash', value: 15 },
  { name: 'Check', value: 15 },
];

const COLORS = [
  'hsl(187,80%,48%)',
  'hsl(260,60%,55%)',
  'hsl(150,60%,45%)',
  'hsl(35,90%,55%)',
];

const transactions = [
  {
    id: 'TXN-5021',
    customer: 'Acme Corp',
    amount: '$18,500',
    method: 'Bank Transfer',
    date: 'Feb 25',
    status: 'Completed',
  },
  {
    id: 'TXN-5020',
    customer: 'Beta LLC',
    amount: '$7,200',
    method: 'Credit Card',
    date: 'Feb 24',
    status: 'Completed',
  },
  {
    id: 'TXN-5019',
    customer: 'Gamma Inc',
    amount: '$12,800',
    method: 'Bank Transfer',
    date: 'Feb 23',
    status: 'Pending',
  },
  {
    id: 'TXN-5018',
    customer: 'Delta Co',
    amount: '$5,400',
    method: 'Cash',
    date: 'Feb 22',
    status: 'Completed',
  },
  {
    id: 'TXN-5017',
    customer: 'Epsilon Ltd',
    amount: '$22,100',
    method: 'Check',
    date: 'Feb 20',
    status: 'Overdue',
  },
];

const PaymentReport = () => (
  <ReportLayout
    title="Payment Report"
    subtitle="Monitor payment flows and transaction history"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Received"
        value="$413,000"
        change="+15.3% from last month"
        changeType="up"
        icon={CreditCard}
      />
      <StatCard
        label="Completed"
        value="342"
        change="98.2% success rate"
        changeType="up"
        icon={CheckCircle}
      />
      <StatCard
        label="Pending"
        value="$97,000"
        change="23 transactions"
        changeType="neutral"
        icon={Clock}
      />
      <StatCard
        label="Overdue"
        value="$14,500"
        change="5 transactions"
        changeType="down"
        icon={AlertTriangle}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="report-card lg:col-span-2">
        <h3 className="text-foreground font-semibold mb-4">Payment Trends</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={paymentTrends}>
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
        <h3 className="text-foreground font-semibold mb-4">Payment Methods</h3>
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
          {methodData.map((item, i) => (
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
      <h3 className="text-foreground font-semibold mb-4">Recent Transactions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">TXN ID</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Customer</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Amount</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Method</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-2 font-mono text-primary">{t.id}</td>
                <td className="py-3 px-2 text-foreground">{t.customer}</td>
                <td className="py-3 px-2 text-foreground font-medium">{t.amount}</td>
                <td className="py-3 px-2 text-muted-foreground">{t.method}</td>
                <td className="py-3 px-2 text-muted-foreground">{t.date}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </ReportLayout>
);

export default PaymentReport;
