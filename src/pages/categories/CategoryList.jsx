import React from 'react';
import { Helmet } from 'react-helmet';

const CategoryList = () => {
  return (
    <>
      <Helmet>
        <title>Category List - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Category List</h1>
          <p className="text-muted-foreground">View all categories</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Category list table coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default CategoryList;
