import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  ShoppingCart,
  CreditCard,
  Package,
  Warehouse,
  DollarSign,
  Users,
  Building2,
  Truck,
} from 'lucide-react';

const reports = [
  {
    path: '/reports/purchase',
    label: 'Purchase Report',
    description: 'Track purchasing activities & orders',
    icon: ShoppingCart,
  },
  {
    path: '/reports/payment',
    label: 'Payment Report',
    description: 'Monitor payment flows & transactions',
    icon: CreditCard,
  },
  {
    path: '/reports/product',
    label: 'Product Report',
    description: 'Analyze product performance & sales',
    icon: Package,
  },
  {
    path: '/reports/stock',
    label: 'Stock Report',
    description: 'Monitor inventory levels & movements',
    icon: Warehouse,
  },
  {
    path: '/reports/expense',
    label: 'Expense Report',
    description: 'Track business expenses & costs',
    icon: DollarSign,
  },
  {
    path: '/reports/customer',
    label: 'Customer Report',
    description: 'Understand customer behavior',
    icon: Users,
  },
  {
    path: '/reports/warehouse',
    label: 'Warehouse Report',
    description: 'Warehouse operations & utilization',
    icon: Building2,
  },
  {
    path: '/reports/supplier',
    label: 'Supplier Report',
    description: 'Evaluate supplier performance',
    icon: Truck,
  },
];

const Reports = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Business Reports - iphone center.lk</title>
        <meta
          name="description"
          content="Select a report to view detailed business insights"
        />
      </Helmet>

      <div className="min-h-[calc(100vh-6rem)] bg-background px-2 py-4 sm:px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Business Reports
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Select a report to view detailed business insights
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.path}
                  type="button"
                  onClick={() => navigate(report.path)}
                  className="nav-button glow-border items-start text-left gap-3 p-5"
                >
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-sm">
                      {report.label}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      {report.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
