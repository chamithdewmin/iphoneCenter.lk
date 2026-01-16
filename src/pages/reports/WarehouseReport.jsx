import React from 'react';
import { Helmet } from 'react-helmet';

const WarehouseReport = () => {
  return (
    <>
      <Helmet>
        <title>Warehouse Report - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Report</h1>
          <p className="text-muted-foreground">View warehouse report</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Warehouse report coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default WarehouseReport;
