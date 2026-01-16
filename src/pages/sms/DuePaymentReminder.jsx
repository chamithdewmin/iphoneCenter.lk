import React from 'react';
import { Helmet } from 'react-helmet';

const DuePaymentReminder = () => {
  return (
    <>
      <Helmet>
        <title>Due Payment Reminder - iphone center.lk</title>
      </Helmet>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Due Payment Reminder</h1>
          <p className="text-muted-foreground">Send due payment reminder SMS</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-secondary">
          <p className="text-muted-foreground">Due payment reminder interface coming soon...</p>
        </div>
      </div>
    </>
  );
};

export default DuePaymentReminder;
