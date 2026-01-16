import React from 'react';
import { Helmet } from 'react-helmet';

const ExpenseList = () => {
  return (
    <>
      <Helmet>
        <title>Expense List - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Expense List</h1>
          <p className="text-muted-foreground">View all expenses</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Expense list table coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ExpenseList;
