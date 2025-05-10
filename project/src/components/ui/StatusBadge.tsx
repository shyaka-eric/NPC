import React from 'react';
import Badge, { getStatusBadgeVariant } from './Badge';
import { formatItemStatus } from '../../utils/formatters';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const variant = getStatusBadgeVariant(status);
  const formattedStatus = formatItemStatus(status);

  return (
    <Badge variant={variant} className={className}>
      {formattedStatus}
    </Badge>
  );
};

export default StatusBadge;