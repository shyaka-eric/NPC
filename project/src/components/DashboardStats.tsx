import React, { useEffect, useState } from 'react';
import { Package, ClipboardList, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import StatCard from './StatCard';
import { formatNumber } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { fetchRepairRequests } from '../services/api';

const DashboardStats: React.FC = () => {
  const { items, issuedItems = [], fetchIssuedItems } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [pendingRepairCount, setPendingRepairCount] = useState<number>(0);

  useEffect(() => {
    fetchIssuedItems();
  }, [fetchIssuedItems]);

  useEffect(() => {
    // Fetch pending repair requests for the logged-in user
    const fetchPendingRepairs = async () => {
      if (!user) return;
      try {
        const data = await fetchRepairRequests();
        const pending = (data as any[]).filter(r => r.status === 'pending' && r.type === 'repair' && r.requested_by === user.id);
        setPendingRepairCount(pending.length);
      } catch (err) {
        setPendingRepairCount(0);
      }
    };
    fetchPendingRepairs();
  }, [user]);

  if (!user) return null; // Ensure user is not null before rendering

  // Fix: use correct status value for in-stock items
  const inStockItems = items.filter(item => item.status === 'in-stock').reduce((sum, item) => sum + item.quantity, 0);
  const inUseItems = issuedItems
    .filter(item => String(item.assigned_to) === String(user?.id))
    .length;
  const damagedItems = items.filter(item => item.status === 'damaged').reduce((sum, item) => sum + item.quantity, 0);
  const pendingRequests = requests.filter(
    req => req.status === 'pending' && req.requested_by === user?.id
  ).length;
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
              onClick={() => navigate('/in-use-items')}
            />
            <StatCard
              title="Pending Repair Requests"
              value={formatNumber(pendingRepairCount)}
              icon={<CheckCircle size={24} />}
              onClick={() => navigate('/PendingRepairRequests')}
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests}
              icon={<ClipboardList size={24} />}
              onClick={() => navigate('/pending-requests')}
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
              onClick={() => navigate('/admin/stock')}
            />
            <StatCard
              title="Pending Requests"
              value={requests.filter(req => req.status === 'pending').length}
              icon={<ClipboardList size={24} />}
              onClick={() => navigate('/pending-requests')}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {renderCards()}
    </div>
  );
};

export default DashboardStats;