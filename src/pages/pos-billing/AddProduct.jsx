import React from 'react';
import { Helmet } from 'react-helmet';

const AddProduct = () => {
  return (
    <>
      <Helmet>
        <title>Add Product to Cart - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Product to Cart</h1>
          <p className="text-muted-foreground">Add products to the cart</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Add product interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddProduct;
