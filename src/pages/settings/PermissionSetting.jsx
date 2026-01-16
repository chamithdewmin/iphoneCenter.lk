import React from 'react';
import { Helmet } from 'react-helmet';

const PermissionSetting = () => {
  return (
    <>
      <Helmet>
        <title>Permission Setting - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Permission Setting</h1>
          <p className="text-muted-foreground">Configure user permissions</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Permission settings form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default PermissionSetting;
