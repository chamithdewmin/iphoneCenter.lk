import React from 'react';
import { Helmet } from 'react-helmet';

const Roles = () => {
  return (
    <>
      <Helmet>
        <title>Roles - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Role management coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default Roles;
