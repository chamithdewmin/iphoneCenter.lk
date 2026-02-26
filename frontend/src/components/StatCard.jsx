import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatCard = ({ label, value, change, changeType = 'neutral', icon: Icon }) => {
  const iconBgClass =
    changeType === 'up'
      ? 'bg-success/10 text-success'
      : changeType === 'down'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-primary/10 text-primary';

  const ChangeIcon =
    changeType === 'up' ? ArrowUpRight : changeType === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="report-card flex items-start justify-between gap-3">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value mt-1">{value}</p>
        {change && (
          <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <ChangeIcon
              className={`w-3 h-3 ${
                changeType === 'up'
                  ? 'text-success'
                  : changeType === 'down'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            />
            <span>{change}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;

