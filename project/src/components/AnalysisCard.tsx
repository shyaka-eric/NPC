import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Card from './ui/Card';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import { fetchRepairRequests } from '../services/api';
import { API_URL } from '../config';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalysisCard: React.FC = () => {
  const { items, issuedItems = [] } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user } = useAuthStore();
  const [pendingRepairCount, setPendingRepairCount] = useState<number>(0);

  useEffect(() => {
    if (user?.role === 'unit-leader') {
      const fetchPendingRepairs = async () => {
        try {
          const data = await fetchRepairRequests();
          const pending = (data as any[]).filter(r => r.status === 'pending' && r.type === 'repair' && r.requested_by === user.id);
          setPendingRepairCount(pending.length);
        } catch {
          setPendingRepairCount(0);
        }
      };
      fetchPendingRepairs();
    }
  }, [user]);

  if (!user) return null;

  // Unit Leader: In-Use Items, Item Requests, Repair Requests (all for this user)
  if (user.role === 'unit-leader') {
    const inUseItems = issuedItems.filter(item => String(item.assigned_to) === String(user.id)).length;
    const itemRequests = requests.filter(req => req.type === 'new' && req.status === 'pending' && req.requested_by === user.id).length;
    // Use fetched pendingRepairCount for repair requests
    const repairRequests = pendingRepairCount;
    const chartData = {
      labels: ['In-Use Items', 'Item Requests', 'Repair Requests'],
      datasets: [
        {
          label: 'Count',
          data: [inUseItems, itemRequests, repairRequests],
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',
            'rgba(16, 185, 129, 0.5)',
            'rgba(245, 158, 11, 0.5)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
          ],
          borderWidth: 1,
        },
      ],
    };
    const chartOptions = {
      responsive: true,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    };
    return (
      <Card title="Analysis" className="h-full">
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">In-Use Items</p>
            <p className="text-2xl font-semibold text-blue-500">{inUseItems}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Item Requests</p>
            <p className="text-2xl font-semibold text-green-500">{itemRequests}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Repair Requests</p>
            <p className="text-2xl font-semibold text-amber-500">{repairRequests}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Admin: Available Items, New Item Requests, Repair Requests (system-wide)
  if (user.role === 'admin') {
    // Use correct ItemStatus value for available items
    const availableItems = items.filter(item => (item.status as any) === 'available').reduce((sum, item) => sum + item.quantity, 0);
    const newItemRequests = requests.filter(req => req.type === 'new' && req.status === 'pending').length;
    const repairRequests = requests.filter(req => req.type === 'repair' && req.status === 'pending').length;
    const chartData = {
      labels: ['Available Items', 'New Item Requests', 'Repair Requests'],
      datasets: [
        {
          label: 'Count',
          data: [availableItems, newItemRequests, repairRequests],
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',
            'rgba(16, 185, 129, 0.5)',
            'rgba(245, 158, 11, 0.5)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
          ],
          borderWidth: 1,
        },
      ],
    };
    const chartOptions = {
      responsive: true,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    };
    return (
      <Card title="Analysis" className="h-full">
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Available Items</p>
            <p className="text-2xl font-semibold text-blue-500">{availableItems}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">New Item Requests</p>
            <p className="text-2xl font-semibold text-green-500">{newItemRequests}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Repair Requests</p>
            <p className="text-2xl font-semibold text-amber-500">{repairRequests}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Logistics Officer: Stock, Damaged Items, Pending Requests
  if (user.role === 'logistics-officer') {
    const inStockItems = items.filter(item => String(item.status) === 'available').reduce((sum, item) => sum + item.quantity, 0);
    // Fetch damaged items from API and count unique serial numbers
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
          // Defensive: filter out null/undefined serials
          const serials = new Set((data || []).map((d: any) => d.issued_item_serial_number).filter(Boolean));
          setDamagedSerialCount(serials.size);
        } catch {
          setDamagedSerialCount(0);
        }
      };
      fetchDamagedItems();
    }, []);
    const pendingRequests = requests.filter(req => req.status === 'pending').length;
    const chartData = {
      labels: ['Stock', 'Damaged Items', 'Pending Requests'],
      datasets: [
        {
          label: 'Count',
          data: [inStockItems, damagedSerialCount, pendingRequests],
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',
            'rgba(245, 158, 11, 0.5)',
            'rgba(16, 185, 129, 0.5)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(245, 158, 11)',
            'rgb(16, 185, 129)',
          ],
          borderWidth: 1,
        },
      ],
    };
    const chartOptions = {
      responsive: true,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    };
    return (
      <Card title="Analysis" className="h-full">
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Stock</p>
            <p className="text-2xl font-semibold text-blue-500">{inStockItems}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Damaged Items</p>
            <p className="text-2xl font-semibold text-amber-500">{damagedSerialCount}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Pending Requests</p>
            <p className="text-2xl font-semibold text-green-500">{pendingRequests}</p>
          </div>
        </div>
      </Card>
    );
  }

  // System Admin: Available Items, Requests, Users (example, adjust as needed)
  if (user.role === 'system-admin') {
    const inStockItems = items.filter(item => (item.status as any) === 'available').reduce((sum, item) => sum + item.quantity, 0);
    const totalRequests = requests.length;
    const totalUsers = 42; // Placeholder
    const chartData = {
      labels: ['Available Items', 'Requests', 'Users'],
      datasets: [
        {
          label: 'Count',
          data: [inStockItems, totalRequests, totalUsers],
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',
            'rgba(16, 185, 129, 0.5)',
            'rgba(245, 158, 11, 0.5)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
          ],
          borderWidth: 1,
        },
      ],
    };
    const chartOptions = {
      responsive: true,
      plugins: { legend: { display: false }, title: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    };
    return (
      <Card title="Analysis" className="h-full">
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Available Items</p>
            <p className="text-2xl font-semibold text-blue-500">{inStockItems}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Requests</p>
            <p className="text-2xl font-semibold text-green-500">{totalRequests}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Users</p>
            <p className="text-2xl font-semibold text-amber-500">{totalUsers}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Default: nothing
  return null;
};

export default AnalysisCard;