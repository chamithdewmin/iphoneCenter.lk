import React from 'react';
import { Helmet } from 'react-helmet';

const AddWarehouse = () => {
  return (
    <>
      <Helmet>
        <title>Add Warehouse - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Warehouse</h1>
          <p className="text-muted-foreground">Add a new warehouse</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Warehouse form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddWarehouse;
