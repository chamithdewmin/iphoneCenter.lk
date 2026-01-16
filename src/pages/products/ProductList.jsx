import React from 'react';
import { Helmet } from 'react-helmet';

const ProductList = () => {
  return (
    <>
      <Helmet>
        <title>Product List - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Product List</h1>
          <p className="text-muted-foreground">View and manage all products</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Product list table coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default ProductList;
