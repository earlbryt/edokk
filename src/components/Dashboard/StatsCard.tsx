
import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  prefix?: string;
  suffix?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  className,
  trend,
  prefix,
  suffix
}) => {
  return (
    <div className={cn(
      "bg-white p-6 rounded-lg border border-gray-100 shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-end gap-3">
        <div className="text-2xl font-bold text-gray-900">
          {prefix && <span className="text-gray-500 text-lg">{prefix}</span>}
          {value}
          {suffix && <span className="text-gray-500 text-lg">{suffix}</span>}
        </div>
        {trend && (
          <div className={cn(
            "text-sm font-medium flex items-center",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            <span className="mr-1">
              {trend.positive ? "↑" : "↓"}
            </span>
            {trend.value}%
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
