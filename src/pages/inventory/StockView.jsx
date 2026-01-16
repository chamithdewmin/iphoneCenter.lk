import React from 'react';
import { Helmet } from 'react-helmet';

const StockView = () => {
  return (
    <>
      <Helmet>
        <title>Product Stock View - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Stock View</h1>
          <p className="text-muted-foreground">View product stock levels</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Stock view interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default StockView;
