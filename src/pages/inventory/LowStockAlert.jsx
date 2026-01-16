import React from 'react';
import { Helmet } from 'react-helmet';

const LowStockAlert = () => {
  return (
    <>
      <Helmet>
        <title>Low Stock Alert - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Low Stock Alert</h1>
          <p className="text-muted-foreground">View products with low stock</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Low stock alerts coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default LowStockAlert;
