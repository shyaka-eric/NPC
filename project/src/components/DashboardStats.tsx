import React, { useEffect, useState } from 'react';
import { Package, ClipboardList, CheckCircle, Users, AlertTriangle, Trash, Wrench } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import StatCard from './StatCard';
import { formatNumber } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { fetchRepairRequests } from '../services/api';
import { API_URL } from '../config';
import { api } from '../api';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const DashboardStats: React.FC = () => {
  const { items, issuedItems = [], fetchIssuedItems } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user, users, fetchUsers } = useAuthStore();
  const navigate = useNavigate();
  const [pendingRepairCount, setPendingRepairCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [rangeType, setRangeType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const today = new Date();

  useEffect(() => {
    fetchIssuedItems();
    if (user?.role === 'system-admin') {
      fetchUsers();
    }
  }, [fetchIssuedItems, fetchUsers, user]);

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

  useEffect(() => {
    // Fetch user count for the Users card
    const fetchUsersCount = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || API_URL}/api/users/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setUsersCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setUsersCount(0);
      }
    };
    fetchUsersCount();
  }, []);

  // Helper to get date range
  const getRange = () => {
    switch (rangeType) {
      case 'daily':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'weekly':
        return { start: startOfWeek(today), end: endOfWeek(today) };
      case 'monthly':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        if (customStart && customEnd) {
          return { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) };
        }
        return { start: startOfDay(today), end: endOfDay(today) };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };
  const { start, end } = getRange();

  // Helper to check if a date is in range (accepts string or Date)
  const inRange = (dateVal: string | Date | undefined) => {
    if (!dateVal) return false;
    let date: Date;
    if (typeof dateVal === 'string') {
      date = parseISO(dateVal);
    } else {
      date = dateVal;
    }
    return isWithinInterval(date, { start, end });
  };

  // Filtered data helpers (handle possible missing created_at/requestedAt/assigned_date fields)
  const filteredRequests = requests.filter(r => inRange(r.created_at));
  const filteredItems = items.filter(i => inRange(i.createdAt));
  const filteredIssuedItems = issuedItems.filter(i => inRange(i.assigned_date));

  // Fix: use correct status value for available items (should match AnalysisCard logic)
  const availableItems = filteredItems.filter(item => item.quantity > 0).reduce((sum, item) => sum + item.quantity, 0);
  const inUseItems = filteredIssuedItems
    .filter(item => String(item.assigned_to) === String(user?.id))
    .length;
  const damagedItems = filteredItems.filter(item => item.status === 'damaged').reduce((sum, item) => sum + item.quantity, 0);
  const pendingRequests = filteredRequests.filter(
    req => req.status === 'pending' && req.requested_by === user?.id
  ).length;
  const totalUsers = user?.role === 'system-admin' ? users.length : 42; // Use real count for system-admin
  const inStockItems = filteredItems.filter(item => item.quantity > 0).reduce((sum, item) => sum + item.quantity, 0);

  // Update renderCards to use filtered data for all roles
  function renderCards() {
    if (!user) return null;
    switch (user.role) {
      case 'unit-leader':
        return (
          <>
            <StatCard
              title="In-Use Items"
              value={formatNumber(filteredIssuedItems.filter(item => String(item.assigned_to) === String(user.id)).length)}
              icon={<Package size={24} />}
              onClick={() => navigate('/in-use-items')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
            <StatCard
              title="My Item Requests"
              value={formatNumber(filteredRequests.filter(req => req.requested_by === user.id && req.type === 'new').length)}
              icon={<ClipboardList size={24} />}
              onClick={() => navigate('/my-requests')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
            <StatCard
              title="My Repair Requests"
              value={formatNumber(filteredRequests.filter(req => req.requested_by === user.id && req.type === 'repair').length)}
              icon={<AlertTriangle size={24} />}
              onClick={() => navigate('/my-repair-requests')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
          </>
        );
      case 'admin':
        return (
          <>
            <StatCard
              title="Available Items"
              value={formatNumber(filteredItems.filter(item => item.quantity > 0).reduce((sum, item) => sum + item.quantity, 0))}
              icon={<Package size={32} />}
              className="flex-1 w-full h-32 text-2xl cursor-pointer"
              onClick={() => navigate('/stock-availability')}
            />
            <StatCard
              title="Item Requests"
              value={formatNumber(filteredRequests.filter(req => req.type === 'new').length)}
              icon={<ClipboardList size={32} />}
              className="flex-1 w-full h-32 text-2xl cursor-pointer"
              onClick={() => navigate('/requests')}
            />
            <StatCard
              title="Repair Requests"
              value={formatNumber(filteredRequests.filter(req => req.type === 'repair').length)}
              icon={<AlertTriangle size={32} />}
              className="flex-1 w-full h-32 text-2xl cursor-pointer"
              onClick={() => navigate('/repair-items')}
            />
          </>
        );
      case 'logistics-officer': {
        // Damaged items count is not filtered by date, as it is fetched from API
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
        // Some APIs may return status as enum or string, so use loose comparison
        const repairInProcessCount = filteredRequests.filter(req => String(req.status) === 'repair-in-process').length;
        const approvedCount = filteredRequests.filter(req => String(req.status) === 'approved').length;
        return (
          <>
            <StatCard
              title="Repair In Process"
              value={formatNumber(repairInProcessCount)}
              icon={<Wrench size={24} />} // Changed icon to Wrench for Repair In Process
              onClick={() => navigate('/repair-in-process')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
            <StatCard
              title="Damaged Items"
              value={formatNumber(damagedSerialCount)}
              icon={<AlertTriangle size={24} />} // Kept AlertTriangle for Damaged Items
              onClick={() => navigate('/damaged-items')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
            <StatCard
              title="Approved Items"
              value={formatNumber(approvedCount)}
              icon={<CheckCircle size={24} />} // Changed to CheckCircle for approved/issuing
              onClick={() => navigate('/issue-items')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
          </>
        );
      }
      case 'system-admin': {
        const [deletedCount, setDeletedCount] = useState(0);
        useEffect(() => {
          const fetchDeletedCount = async () => {
            try {
              const res = await api.get('items/deleted/');
              setDeletedCount(res.data.count !== undefined ? res.data.count : (Array.isArray(res.data) ? res.data.length : 0));
            } catch {
              setDeletedCount(0);
            }
          };
          fetchDeletedCount();
        }, []);
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
              {/* Deleted Items Card */}
              <StatCard
                icon={<Trash size={32} />}
                title="Deleted Items"
                value={formatNumber(deletedCount)}
                onClick={() => navigate('/deleted-items')}
                className="w-full h-32 text-2xl cursor-pointer"
              />
              {/* Users Card */}
              <StatCard
                icon={<Users size={32} />}
                title="Users"
                value={formatNumber(usersCount)}
                onClick={() => navigate('/users')}
                className="w-full h-32 text-2xl cursor-pointer"
              />
            </div>
          </>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className="w-full mb-8">
      {/* Range Filter UI */}
      <div className="flex gap-4 mb-4 items-center">
        <label>Range:</label>
        <select value={rangeType} onChange={e => setRangeType(e.target.value as any)} className="border rounded px-2 py-1">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="custom">Custom</option>
        </select>
        {rangeType === 'custom' && (
          <>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border rounded px-2 py-1" />
            <span>to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border rounded px-2 py-1" />
          </>
        )}
      </div>
      <div className="flex flex-row justify-center items-center gap-8 w-full mb-8">
        {renderCards()}
      </div>
    </div>
  );
};

export default DashboardStats;