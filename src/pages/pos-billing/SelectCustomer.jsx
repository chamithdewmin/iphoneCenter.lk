import React from 'react';
import { Helmet } from 'react-helmet';

const SelectCustomer = () => {
  return (
    <>
      <Helmet>
        <title>Select Customer - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Select Customer</h1>
          <p className="text-muted-foreground">Select customer for sale</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Customer selection interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default SelectCustomer;
