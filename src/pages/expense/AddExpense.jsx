import React from 'react';
import { Helmet } from 'react-helmet';

const AddExpense = () => {
  return (
    <>
      <Helmet>
        <title>Add Expense - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Expense</h1>
          <p className="text-muted-foreground">Record a new expense</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Expense form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddExpense;
