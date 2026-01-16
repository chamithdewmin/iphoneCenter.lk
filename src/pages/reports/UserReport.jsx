import React from 'react';
import { Helmet } from 'react-helmet';

const UserReport = () => {
  return (
    <>
      <Helmet>
        <title>User Report - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Report</h1>
          <p className="text-muted-foreground">View user report</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">User report coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default UserReport;
