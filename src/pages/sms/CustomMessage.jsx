import React from 'react';
import { Helmet } from 'react-helmet';

const CustomMessage = () => {
  return (
    <>
      <Helmet>
        <title>Custom Message - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Custom Message</h1>
          <p className="text-muted-foreground">Send custom SMS message</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Custom message interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default CustomMessage;
