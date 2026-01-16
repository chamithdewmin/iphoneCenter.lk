import React from 'react';
import { Helmet } from 'react-helmet';

const UnitValue = () => {
  return (
    <>
      <Helmet>
        <title>Unit / Value - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Unit / Value</h1>
          <p className="text-muted-foreground">Manage product units and values</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Unit and value management coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default UnitValue;
