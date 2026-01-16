import React from 'react';
import { Helmet } from 'react-helmet';

const SendCustomer = () => {
  return (
    <>
      <Helmet>
        <title>Send SMS to Customer - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Send SMS to Customer</h1>
          <p className="text-muted-foreground">Send SMS to individual customer</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Send SMS interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default SendCustomer;
