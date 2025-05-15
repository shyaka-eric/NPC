import React from 'react';
import { Package, ClipboardList, CheckCircle } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import StatCard from './StatCard';
import { formatNumber } from '../utils/formatters';

const DashboardStats: React.FC = () => {
  const { items } = useItemsStore();
  const { requests } = useRequestsStore();
  
  // Calculate statistics
  //const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const inStockItems = items.filter(item => item.status === 'in-stock').reduce((sum, item) => sum + item.quantity, 0);
  // Use assigned_quantity for in-use items count
  const inUseItems = items.filter(item => item.status === 'in-use').reduce((sum, item) => sum + (item.assigned_quantity || 0), 0);
  const pendingRequests = requests.filter(req => req.status === 'pending').length;
  const approvedRequests = requests.filter(req => req.status === 'approved' || req.status === 'issued').length;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="In-Use Items"
        value={formatNumber(inUseItems)}
        icon={<Package size={24} />}
        trend={{
          value: 3,
          label: "from last month",
          isPositive: true
        }}
        onClick={() => window.location.href = '/items-in-use'}
      />
      <StatCard
        title="Available Items"
        value={formatNumber(inStockItems)}
        icon={<Package size={24} />}
        trend={{
          value: 3,
          label: "from last month",
          isPositive: true
        }}
      />
      <StatCard
        title="Pending Requests"
        value={pendingRequests}
        icon={<ClipboardList size={24} />}
        trend={{
          value: 12,
          label: "from last week",
          isPositive: false
        }}
      />
      <StatCard
        title="Fulfilled Requests"
        value={approvedRequests}
        icon={<CheckCircle size={24} />}
        trend={{
          value: 8,
          label: "from last week",
          isPositive: true
        }}
      />
    </div>
  );
};

export default DashboardStats;