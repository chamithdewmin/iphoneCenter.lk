import React from 'react';
import { Helmet } from 'react-helmet';

const AddBiller = () => {
  return (
    <>
      <Helmet>
        <title>Add Biller - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Biller</h1>
          <p className="text-muted-foreground">Add a new biller</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Biller form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddBiller;
