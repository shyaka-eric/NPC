import React, { useMemo } from 'react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { Download } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AdminReports: React.FC = () => {
  const { items } = useItemsStore();
  const { requests } = useRequestsStore();

  // Stock summary
  const stockSummary = useMemo(() => {
    const summary = {
      'In Stock': 0,
      'In Use': 0,
      'Under Repair': 0,
      'Damaged': 0
    };
    items.forEach(item => {
      if (item.status === 'in-stock') summary['In Stock'] += item.quantity;
      if (item.status === 'in-use') summary['In Use'] += item.quantity;
      if (item.status === 'under-repair') summary['Under Repair'] += item.quantity;
      if (item.status === 'damaged') summary['Damaged'] += item.quantity;
    });
    return summary;
  }, [items]);

  // Requests summary
  const issuedRequests = requests.filter(r => r.status === 'issued');
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const deniedRequests = requests.filter(r => r.status === 'denied');
  const completedRequests = requests.filter(r => r.status === 'completed');

  // Chart data
  const stockPieData = {
    labels: Object.keys(stockSummary),
    datasets: [
      {
        data: Object.values(stockSummary),
        backgroundColor: [
          '#2563eb', // blue
          '#22c55e', // green
          '#f59e42', // orange
          '#ef4444'  // red
        ]
      }
    ]
  };

  const requestsBarData = {
    labels: ['Issued', 'Pending', 'Denied', 'Completed'],
    datasets: [
      {
        label: 'Requests',
        data: [issuedRequests.length, pendingRequests.length, deniedRequests.length, completedRequests.length],
        backgroundColor: [
          '#2563eb', // blue
          '#f59e42', // orange
          '#ef4444', // red
          '#22c55e'  // green
        ]
      }
    ]
  };

  // Export handlers
  const handleExportExcel = () => {
    const exportData = items.map(item => ({
      'Name': item.name,
      'Category': item.category,
      'Quantity': item.quantity,
      'Status': item.status,
      'Expiration Date': item.expirationDate ? item.expirationDate.toString() : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'stock_report.xlsx');
  };

  const handleExportPDF = () => {
    alert('PDF export is not implemented in this demo.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Admin Reports"
        description="View and generate reports as an admin."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Download />} onClick={handleExportExcel}>
              Export Excel
            </Button>
            <Button variant="secondary" icon={<Download />} onClick={handleExportPDF}>
              Export PDF
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-4">Stock Levels</h3>
          <Pie data={stockPieData} />
        </div>
        <div className="bg-white rounded shadow p-6">
          <h3 className="font-semibold mb-4">Requests Summary</h3>
          <Bar data={requestsBarData} />
        </div>
      </div>
      <div className="bg-white rounded shadow p-6 mt-8">
        <h3 className="font-semibold mb-4">Recent Requests</h3>
        <ul className="list-disc ml-6">
          {requests.length === 0 && <li>No requests found.</li>}
          {requests.slice(0, 10).map(r => (
            <li key={r.id}>
              {(r.item_name || r.itemName || '-')}
              {' - Requested by '}
              {(r.requested_by_name || r.requestedByName || '-')}
              {' on '}
              {(r.requested_at || r.requestedAt) ? (new Date(r.requested_at || r.requestedAt).toLocaleDateString()) : '-'}
              {' (Status: '}{r.status}{')'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AdminReports; 