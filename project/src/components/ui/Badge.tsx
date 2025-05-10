import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-800',
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'in-stock':
      return 'success';
    case 'in-use':
      return 'primary';
    case 'under-repair':
      return 'warning';
    case 'damaged':
      return 'danger';
    case 'pending':
      return 'info';
    case 'approved':
      return 'success';
    case 'denied':
      return 'danger';
    case 'issued':
      return 'primary';
    case 'completed':
      return 'secondary';
    default:
      return 'default';
  }
}

export default Badge;