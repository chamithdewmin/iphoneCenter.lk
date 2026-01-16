import React from 'react';
import { Helmet } from 'react-helmet';

const ScanBarcode = () => {
  return (
    <>
      <Helmet>
        <title>Scan Barcode - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Scan Barcode</h1>
          <p className="text-muted-foreground">Scan product barcode</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Barcode scanner coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ScanBarcode;
