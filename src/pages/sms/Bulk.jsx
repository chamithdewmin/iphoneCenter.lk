import React from 'react';
import { Helmet } from 'react-helmet';

const BulkSMS = () => {
  return (
    <>
      <Helmet>
        <title>Bulk SMS - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk SMS</h1>
          <p className="text-muted-foreground">Send SMS to multiple customers</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Bulk SMS interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default BulkSMS;
