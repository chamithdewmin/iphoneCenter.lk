import React from 'react';
import { Helmet } from 'react-helmet';

const GeneralSetting = () => {
  return (
    <>
      <Helmet>
        <title>General Setting - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">General Setting</h1>
          <p className="text-muted-foreground">Configure general settings</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">General settings form coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default GeneralSetting;
