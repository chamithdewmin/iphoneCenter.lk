import React from 'react';
import { Helmet } from 'react-helmet';

const ExpenseReport = () => {
  return (
    <>
      <Helmet>
        <title>Expense Report - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Expense Report</h1>
          <p className="text-muted-foreground">View expense report</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Expense report coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ExpenseReport;
