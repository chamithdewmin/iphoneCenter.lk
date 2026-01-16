import React from 'react';
import { Helmet } from 'react-helmet';

const AddUser = () => {
  return (
    <>
      <Helmet>
        <title>Add User - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add User</h1>
          <p className="text-muted-foreground">Add a new user account</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">User form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default AddUser;
