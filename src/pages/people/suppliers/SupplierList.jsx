import React from 'react';
import { Helmet } from 'react-helmet';

const SupplierList = () => {
  return (
    <>
      <Helmet>
        <title>Supplier List - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Supplier List</h1>
          <p className="text-muted-foreground">View all suppliers</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Supplier list table coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default SupplierList;
