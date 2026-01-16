import React from 'react';
import { Helmet } from 'react-helmet';

const AddCategory = () => {
  return (
    <>
      <Helmet>
        <title>Add Category - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Category</h1>
          <p className="text-muted-foreground">Add a new product category</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Category form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddCategory;
