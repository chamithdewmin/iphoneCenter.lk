import React from 'react';
import { Helmet } from 'react-helmet';

const Purchase = () => {
  return (
    <>
      <Helmet>
        <title>Purchase - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Purchase</h1>
          <p className="text-muted-foreground">Manage purchase transactions</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Purchase management coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default Purchase;
