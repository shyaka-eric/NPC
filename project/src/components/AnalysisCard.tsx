import React from 'react';
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
  const { items } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user } = useAuthStore();

  // Only show this analysis for unit leader
  if (!user) return null;

  if (user.role === 'unit-leader') {
    // Calculate statistics for unit leader
    const issuedItems = items.filter(item => item.status === 'in-use');
    const inUseItems = issuedItems.filter(item => String(item.assignedTo) === String(user.id)).length;
    const itemRequests = requests.filter(req => req.type === 'new' && req.status === 'pending' && req.requested_by === user.id).length;
    const repairRequests = requests.filter(req => req.type === 'repair' && req.status === 'pending' && req.requested_by === user.id).length;

    const chartData = {
      labels: ['In-Use Items', 'Item Requests', 'Repair Requests'],
      datasets: [
        {
          label: 'Count',
          data: [inUseItems, itemRequests, repairRequests],
          backgroundColor: [
            'rgba(59, 130, 246, 0.5)',  // blue-500
            'rgba(16, 185, 129, 0.5)',  // green-500
            'rgba(245, 158, 11, 0.5)',  // amber-500
          ],
          borderColor: [
            'rgb(59, 130, 246)',  // blue-500
            'rgb(16, 185, 129)',  // green-500
            'rgb(245, 158, 11)',  // amber-500
          ],
          borderWidth: 1,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
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

  // Admin analysis card (example, you can adjust as needed)
  if (user.role === 'admin') {
    const availableItems = items.filter(item => item.status === 'available').reduce((sum, item) => sum + item.quantity, 0);
    const pendingRequests = requests.filter(req => req.status === 'pending').length;
    const repairRequests = requests.filter(req => req.type === 'repair' && req.status === 'pending').length;

    const chartData = {
      labels: ['Available Items', 'Pending Requests', 'Repair Requests'],
      datasets: [
        {
          label: 'Count',
          data: [availableItems, pendingRequests, repairRequests],
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
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
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
            <p className="text-sm font-medium text-slate-500">Pending Requests</p>
            <p className="text-2xl font-semibold text-green-500">{pendingRequests}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Repair Requests</p>
            <p className="text-2xl font-semibold text-amber-500">{repairRequests}</p>
          </div>
        </div>
      </Card>
    );
  }

  // ...existing code for other roles or return null...
  return null;
};

export default AnalysisCard;