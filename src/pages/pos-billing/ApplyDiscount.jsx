import React from 'react';
import { Helmet } from 'react-helmet';

const ApplyDiscount = () => {
  return (
    <>
      <Helmet>
        <title>Apply Discount - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Apply Discount</h1>
          <p className="text-muted-foreground">Apply discount to sale</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Discount interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ApplyDiscount;
