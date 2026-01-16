import React from 'react';
import { Helmet } from 'react-helmet';

const UserList = () => {
  return (
    <>
      <Helmet>
        <title>User List - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User List</h1>
          <p className="text-muted-foreground">View all users</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">User list table coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default UserList;
