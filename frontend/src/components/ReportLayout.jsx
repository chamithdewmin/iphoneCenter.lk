import React from 'react';

const ReportLayout = ({ title, subtitle, children }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export default ReportLayout;

