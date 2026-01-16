import React from 'react';
import { Helmet } from 'react-helmet';

const NewSale = () => {
  return (
    <>
      <Helmet>
        <title>New Sale - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">New Sale (POS Screen)</h1>
          <p className="text-muted-foreground">Point of Sale billing interface</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">POS screen coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default NewSale;
