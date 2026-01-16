import React from 'react';
import { Helmet } from 'react-helmet';

const Brands = () => {
  return (
    <>
      <Helmet>
        <title>Brands - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">Manage product brands</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Brand management coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default Brands;
