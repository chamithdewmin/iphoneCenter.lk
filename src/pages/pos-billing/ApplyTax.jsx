import React from 'react';
import { Helmet } from 'react-helmet';

const ApplyTax = () => {
  return (
    <>
      <Helmet>
        <title>Apply Tax - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Apply Tax</h1>
          <p className="text-muted-foreground">Apply tax to sale</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Tax interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ApplyTax;
