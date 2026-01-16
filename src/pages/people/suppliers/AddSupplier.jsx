import React from 'react';
import { Helmet } from 'react-helmet';

const AddSupplier = () => {
  return (
    <>
      <Helmet>
        <title>Add Supplier - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Supplier</h1>
          <p className="text-muted-foreground">Add a new supplier</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Supplier form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddSupplier;
