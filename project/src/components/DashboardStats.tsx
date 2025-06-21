import React, { useEffect, useState } from 'react';
import { Package, ClipboardList, CheckCircle, Users, AlertTriangle, Trash, Wrench } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import StatCard from './StatCard';
import { formatNumber } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { api } from '../api';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface DashboardStatsProps {
  rangeType: 'daily' | 'weekly' | 'monthly' | 'custom';
  setRangeType: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly' | 'custom'>>;
  customStart: string;
  setCustomStart: React.Dispatch<React.SetStateAction<string>>;
  customEnd: string;
  setCustomEnd: React.Dispatch<React.SetStateAction<string>>;
  inRange: (dateVal: string | Date | undefined) => boolean;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ rangeType, setRangeType, customStart, setCustomStart, customEnd, setCustomEnd, inRange }) => {
  const { issuedItems = [], fetchIssuedItems } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user, fetchUsers } = useAuthStore();
  const navigate = useNavigate();
  const today = new Date();
  const [damagedSerialCount, setDamagedSerialCount] = useState<number>(0);

  useEffect(() => {
    fetchIssuedItems();
    if (user?.role === 'system-admin') {
      fetchUsers();
    }
  }, [fetchIssuedItems, fetchUsers, user]);

  useEffect(() => {
    if (user?.role !== 'logistics-officer') return;
    const fetchDamagedItems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${import.meta.env.VITE_API_URL || API_URL}/api/damaged-items/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const text = await response.text();
        console.log('Damaged Items API raw response:', text);
        if (!response.ok) {
          console.error('Damaged Items API error status:', response.status);
          setDamagedSerialCount(0);
          return;
        }
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Damaged Items API JSON parse error:', e);
          setDamagedSerialCount(0);
          return;
        }
        let damagedItems = Array.isArray(data) ? data : (data.results || []);
        setDamagedSerialCount(damagedItems.length);
      } catch (e) {
        console.error('Error fetching damaged items:', e);
        setDamagedSerialCount(0);
      }
    };
    fetchDamagedItems();
  }, [user?.role]);

  // Helper to get date range
  const getRange = () => {
    switch (rangeType) {
      case 'daily':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'weekly':
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) }; // Week starts on Monday
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

  // Add debug logs to inspect weekly range calculations
  console.log('Weekly range start:', start, 'Weekly range end:', end);

  // Updated filtering logic to ensure correct range filtering
  const filteredRequests = requests.filter(req => {
    const dateToCheck = req.requestedAt || req.created_at;
    if (!dateToCheck) {
      console.warn('Request with no valid date field:', req);
      return false;
    }
    const requestDate = new Date(dateToCheck);
    return requestDate >= start && requestDate <= end;
  });
  const filteredIssuedItems = issuedItems.filter(i => inRange(i.assigned_date));

  // Fix: use correct status value for available items (should match AnalysisCard logic)
  const repairInProcessCount = requests.filter(req => {
    const status = req.status?.toLowerCase();
    if (status !== 'repair-in-process') return false;
    const dateVal = req.requestedAt || req.created_at;
    if (!dateVal) return false;
    let date: Date;
    if (typeof dateVal === 'string') {
      try {
        date = parseISO(dateVal);
        if (isNaN(date.getTime())) return false;
      } catch {
        return false;
      }
    } else {
      date = dateVal;
    }
    return date >= start && date <= end;
  }).length;
  const approvedCount = requests.filter(req => {
    const status = req.status?.toLowerCase();
    if (status !== 'approved') return false;
    const dateVal = req.requestedAt || req.created_at;
    if (!dateVal) return false;
    let date: Date;
    if (typeof dateVal === 'string') {
      try {
        date = parseISO(dateVal);
        if (isNaN(date.getTime())) return false;
      } catch {
        return false;
      }
    } else {
      date = dateVal;
    }
    return date >= start && date <= end;
  }).length;

  // Add debug logs to inspect filteredRequests and rangeType
  console.log('Range type:', rangeType);
  console.log('Filtered requests:', filteredRequests);


  // Updated navigation logic to pass range parameters
  const navigateToPage = (path: string) => {
    navigate(`${path}?rangeType=${rangeType}&customStart=${customStart}&customEnd=${customEnd}`);
  };

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
              icon={<Package size={24} className="text-blue-500" />} // Blue color for In-Use Items
              onClick={() => navigate(`/in-use-items?rangeType=${rangeType}&customStart=${customStart}&customEnd=${customEnd}`)}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl"
            />
            <StatCard
              title="My Item Requests"
              value={formatNumber(filteredRequests.filter(req => req.requested_by === user.id && req.type === 'new').length)}
              icon={<ClipboardList size={24} className="text-green-500" />} // Green color for My Item Requests
              onClick={() => navigateToPage('/my-requests')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
            <StatCard
              title="My Repair Requests"
              value={formatNumber(filteredRequests.filter(req => req.requested_by === user.id && req.type === 'repair').length)}
              icon={<AlertTriangle size={24} className="text-amber-500" />} // Amber color for My Repair Requests
              onClick={() => navigateToPage('/my-repair-requests')}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
          </>
        );
      case 'admin':
        return (
          <>
            <StatCard
              title="Item Requests"
              value={formatNumber(filteredRequests.filter(req => req.type === 'new' && inRange(req.requestedAt || req.created_at)).length)}
              icon={<ClipboardList size={32} className="text-green-500" />} // Purple color for Item Requests
              className="flex-1 w-full h-32 text-2xl cursor-pointer"
              onClick={() => navigate(`/requests?rangeType=${rangeType}&customStart=${customStart}&customEnd=${customEnd}`)}
            />
            <StatCard
              title="Repair Requests"
              value={formatNumber(filteredRequests.filter(req => req.type === 'repair' && inRange(req.requestedAt || req.created_at)).length)}
              icon={<AlertTriangle size={32} className="text-yellow-500" />} // Red color for Repair Requests
              className="flex-1 w-full h-32 text-2xl cursor-pointer"
              onClick={() => navigateToPage('/repair-items')}
            />
          </>
        );
      case 'logistics-officer': {
        return (
          <>
            <StatCard
              title="Repair In Process"
              value={formatNumber(repairInProcessCount)}
              icon={<Wrench size={24} className="text-blue-500" />} // Blue for Repair In Process
              onClick={() => navigate(`/repair-in-process?rangeType=${rangeType}&customStart=${customStart}&customEnd=${customEnd}`)}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
            <StatCard
              title="Damaged Items"
              value={formatNumber(damagedSerialCount)}
              icon={<AlertTriangle size={24} className="text-red-500" />} // Red for Damaged Items
              onClick={() => navigate(`/damaged-items?rangeType=${rangeType}&customStart=${customStart}&customEnd=${customEnd}`)}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
            <StatCard
              title="Approved Items"
              value={formatNumber(approvedCount)}
              icon={<CheckCircle size={24} className="text-green-500" />} // Green for Approved Items
              onClick={() => navigate(`/issue-items?rangeType=${rangeType}&customStart=${customStart}&customEnd=${customEnd}`)}
              className="flex-1 min-w-[300px] max-w-[600px] h-32 text-2xl cursor-pointer"
            />
          </>
        );
      }
      case 'system-admin': {
        const [deletedCount, setDeletedCount] = useState(0);
        const [userCount, setUserCount] = useState(0);
        useEffect(() => {
          const fetchDeletedCount = async () => {
            try {
              const res = await api.get('items/deleted/');
              let items = res.data.results || res.data;
              if (Array.isArray(items)) {
                const filtered = items.filter((item: any) => {
                  const deletedDate = item.deleted_at || item.updated_at || item.last_updated;
                  if (!deletedDate) return false;
                  const date = new Date(deletedDate);
                  return date >= start && date <= end;
                });
                setDeletedCount(filtered.length);
              } else {
                setDeletedCount(0);
              }
            } catch {
              setDeletedCount(0);
            }
          };
          const fetchUserCount = async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) return setUserCount(0);
              const res = await api.get('users/', { headers: { Authorization: `Bearer ${token}` } });
              let users = res.data;
              setUserCount(Array.isArray(users) ? users.length : 0);
            } catch {
              setUserCount(0);
            }
          };
          fetchDeletedCount();
          fetchUserCount();
        }, [rangeType, customStart, customEnd]);
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full">
              {/* Deleted Items Card */}
              <StatCard
                icon={<Trash size={32} className="text-red-500" />} // Red for Deleted Items
                title="Deleted Items"
                value={formatNumber(deletedCount)}
                onClick={() => navigate(`/deleted-items?rangeType=${rangeType}&customStart=${customStart}&customEnd=${customEnd}`)}
                className="w-full h-32 text-2xl cursor-pointer"
              />
              {/* Users Card */}
              <StatCard
                icon={<Users size={32} className="text-blue-500" />} // Blue for Users
                title="Users"
                value={formatNumber(userCount)}
                onClick={() => navigate(`/users`)}
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