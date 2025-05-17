import React from 'react';
import { Package, ClipboardList, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import StatCard from './StatCard';
import { formatNumber } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const DashboardStats: React.FC = () => {
  const { items } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null; // Ensure user is not null before rendering

  const inStockItems = items.filter(item => item.status === 'in-stock').reduce((sum, item) => sum + item.quantity, 0);
  const inUseItems = items.filter(item => item.status === 'in-use').reduce((sum, item) => sum + (item.assigned_quantity || 0), 0);
  const damagedItems = items.filter(item => item.status === 'damaged').reduce((sum, item) => sum + item.quantity, 0);
  const pendingRequests = requests.filter(req => req.status === 'pending').length;
  const fulfilledRequests = requests.filter(req => req.status === 'approved' || req.status === 'issued').length;
  const totalUsers = 42; // Placeholder for total users count

  const renderCards = () => {
    switch (user.role) {
      case 'unit-leader':
        return (
          <>
            <StatCard
              title="In-Use Items"
              value={formatNumber(inUseItems)}
              icon={<Package size={24} />}
              onClick={() => navigate('/items-in-use')}
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests}
              icon={<ClipboardList size={24} />}
              onClick={() => navigate('/pending-requests')}
            />
            <StatCard
              title="Fulfilled Requests"
              value={fulfilledRequests}
              icon={<CheckCircle size={24} />}
              onClick={() => navigate('/requests?status=issued')}
            />
          </>
        );
      case 'admin':
        return (
          <>
            <StatCard
              title="Available Items"
              value={formatNumber(inStockItems)}
              icon={<Package size={24} />}
            />
            <StatCard
              title="Requests"
              value={pendingRequests}
              icon={<ClipboardList size={24} />}
            />
            <StatCard
              title="Fulfilled Requests"
              value={fulfilledRequests}
              icon={<CheckCircle size={24} />}
            />
          </>
        );
      case 'logistics-officer':
        return (
          <>
            <StatCard
              title="Stock"
              value={formatNumber(inStockItems)}
              icon={<Package size={24} />}
            />
            <StatCard
              title="Damaged Items"
              value={formatNumber(damagedItems)}
              icon={<AlertTriangle size={24} />}
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests}
              icon={<ClipboardList size={24} />}
            />
          </>
        );
      case 'system-admin':
        return (
          <>
            <StatCard
              title="Available Items"
              value={formatNumber(inStockItems)}
              icon={<Package size={24} />}
            />
            <StatCard
              title="Requests"
              value={pendingRequests}
              icon={<ClipboardList size={24} />}
            />
            <StatCard
              title="Users"
              value={totalUsers}
              icon={<Users size={24} />}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {renderCards()}
    </div>
  );
};

export default DashboardStats;