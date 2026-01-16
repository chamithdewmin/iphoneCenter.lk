import React from 'react';
import { Helmet } from 'react-helmet';

const HoldInvoice = () => {
  return (
    <>
      <Helmet>
        <title>Hold Invoice - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hold Invoice</h1>
          <p className="text-muted-foreground">Hold invoice for later</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Hold invoice interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default HoldInvoice;
