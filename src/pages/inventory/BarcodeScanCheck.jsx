import React from 'react';
import { Helmet } from 'react-helmet';

const BarcodeScanCheck = () => {
  return (
    <>
      <Helmet>
        <title>Barcode Scan Stock Check - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Barcode Scan Stock Check</h1>
          <p className="text-muted-foreground">Check stock by scanning barcode</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Barcode scan stock check coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default BarcodeScanCheck;
