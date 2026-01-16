import React from 'react';
import { Helmet } from 'react-helmet';

const TaxReport = () => {
  return (
    <>
      <Helmet>
        <title>Tax Report - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tax Report</h1>
          <p className="text-muted-foreground">View tax report</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Tax report coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default TaxReport;
