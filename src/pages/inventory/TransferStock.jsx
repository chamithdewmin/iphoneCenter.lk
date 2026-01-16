import React from 'react';
import { Helmet } from 'react-helmet';

const TransferStock = () => {
  return (
    <>
      <Helmet>
        <title>Transfer Stock - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transfer Stock (Warehouse → Shop)</h1>
          <p className="text-muted-foreground">Transfer stock between warehouse and shop</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Stock transfer interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default TransferStock;
