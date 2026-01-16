import React from 'react';
import { Helmet } from 'react-helmet';

const PrintInvoice = () => {
  return (
    <>
      <Helmet>
        <title>Print Invoice - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Print Invoice</h1>
          <p className="text-muted-foreground">Print invoice for sale</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Print invoice interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default PrintInvoice;
