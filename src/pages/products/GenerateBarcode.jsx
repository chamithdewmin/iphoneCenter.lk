import React from 'react';
import { Helmet } from 'react-helmet';

const GenerateBarcode = () => {
  return (
    <>
      <Helmet>
        <title>Generate Barcode - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Generate Barcode</h1>
          <p className="text-muted-foreground">Generate barcodes for products</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Barcode generator coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default GenerateBarcode;
