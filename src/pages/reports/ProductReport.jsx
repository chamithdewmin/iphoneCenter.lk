import React from 'react';
import { Helmet } from 'react-helmet';

const ProductReport = () => {
  return (
    <>
      <Helmet>
        <title>Product Report - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product Report</h1>
          <p className="text-muted-foreground">View product report</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Product report coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ProductReport;
