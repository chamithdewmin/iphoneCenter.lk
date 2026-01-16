import React from 'react';
import { Helmet } from 'react-helmet';

const AddCustomer = () => {
  return (
    <>
      <Helmet>
        <title>Add Customer - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Customer</h1>
          <p className="text-muted-foreground">Add a new customer</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Customer form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddCustomer;
