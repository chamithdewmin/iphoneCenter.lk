import React from 'react';
import { Helmet } from 'react-helmet';

const ShippingChargeReport = () => {
  return (
    <>
      <Helmet>
        <title>Shipping Charge Report - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Shipping Charge Report</h1>
          <p className="text-muted-foreground">View shipping charge report</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Shipping charge report coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ShippingChargeReport;
