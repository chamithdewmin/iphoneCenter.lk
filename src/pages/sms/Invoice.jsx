import React from 'react';
import { Helmet } from 'react-helmet';

const InvoiceSMS = () => {
  return (
    <>
      <Helmet>
        <title>Invoice SMS - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice SMS</h1>
          <p className="text-muted-foreground">Send invoice via SMS</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Invoice SMS interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default InvoiceSMS;
