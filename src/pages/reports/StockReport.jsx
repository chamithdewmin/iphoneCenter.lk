import React from 'react';
import { Helmet } from 'react-helmet';

const StockReport = () => {
  return (
    <>
      <Helmet>
        <title>Stock Report - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stock Report</h1>
          <p className="text-muted-foreground">View stock report</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Stock report coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default StockReport;
