import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  onClick,
  className = '',
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        {icon && <div className="mr-3 text-blue-800">{icon}</div>}
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        {trend && (
          <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-1">{trend.isPositive ? '↑' : '↓'}</span>
            <span>{trend.value}%</span>
            <span className="ml-1 text-slate-500">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;