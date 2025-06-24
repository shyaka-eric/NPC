import React, { useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import Card from './ui/Card';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';

const AnalysisCard: React.FC = () => {
  const { issuedItems = [], items = [], fetchItems } = useItemsStore();
  const { requests } = useRequestsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const loadItems = async () => {
      try {
        await fetchItems();
      } catch (error) {
        console.error('Failed to fetch items:', error);
      }
    };

    loadItems();
  }, [fetchItems]);

  useEffect(() => {
    console.log('Items:', items);
    console.log('Requests:', requests);
    console.log('User:', user);
  }, [items, requests, user]);

  if (!user) return null;

  let chartData;
  let chartOptions;
  let metrics;

  if (user.role === 'admin' || user.role === 'logistics-officer') {
    const availableItemsCount = items.filter(item => item.status === 'available').reduce((total, item) => total + item.quantity, 0);
    const pendingItemRequests = requests.filter(req => req.type === 'new' && req.status === 'pending').length;
    const pendingRepairRequests = requests.filter(req => req.type === 'repair' && req.status === 'pending').length;

    chartData = {
      labels: ['Available Items', 'Pending Item Requests', 'Pending Repair Requests'],
      datasets: [
        {
          label: 'Count',
          data: [availableItemsCount, pendingItemRequests, pendingRepairRequests],
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

    metrics = [
      { label: 'Available Items', value: availableItemsCount, color: 'blue' },
      { label: 'Pending Item Requests', value: pendingItemRequests, color: 'green' },
      { label: 'Pending Repair Requests', value: pendingRepairRequests, color: 'amber' },
    ];
  } else {
    const inUseItems = issuedItems.filter(item => String(item.assigned_to) === String(user.id)).length;
    const itemRequests = requests.filter(req => req.type === 'new' && req.status === 'pending' && req.requested_by === user.id).length;
    const repairRequests = requests.filter(req => req.type === 'repair' && req.status === 'pending' && req.requested_by === user.id).length;

    chartData = {
      labels: ['In-Use Items', 'Pending Item Requests', 'Pending Repair Requests'],
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

    metrics = [
      { label: 'In-Use Items', value: inUseItems, color: 'blue' },
      { label: 'Item Requests', value: itemRequests, color: 'green' },
      { label: 'Repair Requests', value: repairRequests, color: 'amber' },
    ];
  }

  chartOptions = {
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
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className={`text-2xl font-semibold text-${metric.color}-500`}>{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AnalysisCard;