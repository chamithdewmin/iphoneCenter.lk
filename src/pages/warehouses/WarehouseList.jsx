import React from 'react';
import { Helmet } from 'react-helmet';

const WarehouseList = () => {
  return (
    <>
      <Helmet>
        <title>Warehouse List - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Warehouse List</h1>
          <p className="text-muted-foreground">View all warehouses</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Warehouse list table coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default WarehouseList;
