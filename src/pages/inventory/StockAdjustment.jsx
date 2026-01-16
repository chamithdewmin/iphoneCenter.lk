import React from 'react';
import { Helmet } from 'react-helmet';

const StockAdjustment = () => {
  return (
    <>
      <Helmet>
        <title>Stock Adjustment - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stock Adjustment</h1>
          <p className="text-muted-foreground">Adjust product stock levels</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Stock adjustment interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default StockAdjustment;
