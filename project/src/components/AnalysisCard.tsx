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
  const { issuedItems = [] } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user } = useAuthStore();

  // Calculate statistics
  const inUseItems = issuedItems
    .filter(item => String(item.assigned_to) === String(user?.id))
    .length;
  const newRequests = requests.filter(req => req.type === 'new' && req.status === 'pending' && String(req.requested_by) === String(user?.id)).length;
  const repairRequests = requests.filter(req => req.type === 'repair' && req.status === 'pending' && String(req.requested_by) === String(user?.id)).length;

  // Prepare chart data
  const chartData = {
    labels: ['In-Use Items', 'New Requests', 'Repair Requests'],
    datasets: [
      {
        label: 'Count',
        data: [inUseItems, newRequests, repairRequests],
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
          <p className="text-sm font-medium text-slate-500">New Requests</p>
          <p className="text-2xl font-semibold text-green-500">{newRequests}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500">Repair Requests</p>
          <p className="text-2xl font-semibold text-amber-500">{repairRequests}</p>
        </div>
      </div>
    </Card>
  );
};

export default AnalysisCard; 