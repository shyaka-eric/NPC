import React, { useEffect, useState } from 'react';
import { Package, ClipboardList, CheckCircle, Users, AlertTriangle } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import StatCard from './StatCard';
import { formatNumber } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { fetchRepairRequests } from '../services/api';
import { API_URL } from '../config';

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

  // Fix: use correct status value for available items (should match AnalysisCard logic)
  const availableItems = items.filter(item => (item.status as any) === 'available').reduce((sum, item) => sum + item.quantity, 0);
  const inUseItems = issuedItems
    .filter(item => String(item.assigned_to) === String(user?.id))
    .length;
  const damagedItems = items.filter(item => item.status === 'damaged').reduce((sum, item) => sum + item.quantity, 0);
  const pendingRequests = requests.filter(
    req => req.status === 'pending' && req.requested_by === user?.id
  ).length;
  const totalUsers = 42; // Placeholder for total users count
  const inStockItems = items.filter(item => (item.status as any) === 'available').reduce((sum, item) => sum + item.quantity, 0);

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
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
            <StatCard
              title="Pending Repair Requests"
              value={formatNumber(pendingRepairCount)}
              icon={<CheckCircle size={24} />}
              onClick={() => navigate('/PendingRepairRequests')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests}
              icon={<ClipboardList size={24} />}
              onClick={() => navigate('/pending-requests')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
          </>
        );
      case 'admin':
        return (
          <>
            <StatCard
              title="Available Items"
              value={formatNumber(availableItems)}
              icon={<Package size={32} />}
              className="flex-1 w-full h-32 text-2xl cursor-pointer"
              onClick={() => navigate('/stock-availability')}
            />
            <StatCard
              title="Pending Requests"
              value={formatNumber(requests.filter(req => req.status === 'pending').length)}
              icon={<ClipboardList size={32} />}
              className="flex-1 w-full h-32 text-2xl"
              onClick={() => navigate('/pending-requests')}
            />
          </>
        );
      case 'logistics-officer':
        // Count damaged items by unique serial numbers (not by group)
        // Fallback: fetch damaged items directly from API for accurate count
        const [damagedSerialCount, setDamagedSerialCount] = useState<number>(0);
        useEffect(() => {
          const fetchDamagedItems = async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) return;
              const response = await fetch(`${import.meta.env.VITE_API_URL || API_URL}/api/damaged-items/`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const data = await response.json();
              // Count unique serial numbers
              const serials = new Set((data || []).map((d: any) => d.issued_item_serial_number));
              setDamagedSerialCount(serials.size);
            } catch {
              setDamagedSerialCount(0);
            }
          };
          fetchDamagedItems();
        }, []);
        return (
          <>
            <StatCard
              title="Stock"
              value={formatNumber(inStockItems)}
              icon={<Package size={24} />}
              onClick={() => navigate('/stock-management')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
            <StatCard
              title="Damaged Items"
              value={formatNumber(damagedSerialCount)}
              icon={<AlertTriangle size={24} />}
              onClick={() => navigate('/damaged-items')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
            <StatCard
              title="Pending Requests"
              value={formatNumber(requests.filter(req => req.status === 'pending').length)}
              icon={<ClipboardList size={24} />}
              onClick={() => navigate('/pending-requests')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
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
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
            <StatCard
              title="Requests"
              value={pendingRequests}
              icon={<ClipboardList size={24} />}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
            <StatCard
              title="Users"
              value={totalUsers}
              icon={<Users size={24} />}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-row justify-center items-center gap-8 w-full mb-8">
      {renderCards()}
    </div>
  );
};

export default DashboardStats;