import React from 'react';
import { Helmet } from 'react-helmet';

const Sales = () => {
  return (
    <>
      <Helmet>
        <title>Sales - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Manage sales transactions</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Sales management coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default Sales;
