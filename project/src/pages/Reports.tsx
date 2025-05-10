import React, { useMemo } from 'react';
import { useItemsStore } from '../store/itemsStore';
import { useRequestsStore } from '../store/requestsStore';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { Download } from 'lucide-react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Reports: React.FC = () => {
  const { items } = useItemsStore();
  const { requests } = useRequestsStore();

  // Stock level summary
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
  const repairRequests = requests.filter(r => r.type === 'repair');

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

  const issuedBarData = {
    labels: issuedRequests.map(r => r.itemName),
    datasets: [
      {
        label: 'Issued Quantity',
        data: issuedRequests.map(r => r.quantity),
        backgroundColor: '#2563eb'
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

  // Placeholder for PDF export
  const handleExportPDF = () => {
    alert('PDF export is not implemented in this demo.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Reports"
        description="View and export stock and request reports"
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
          <h3 className="font-semibold mb-4">Issued Items</h3>
          <Bar data={issuedBarData} />
        </div>
      </div>
      <div className="bg-white rounded shadow p-6 mt-8">
        <h3 className="font-semibold mb-4">Repair Requests</h3>
        <ul className="list-disc ml-6">
          {repairRequests.length === 0 && <li>No repair requests found.</li>}
          {repairRequests.map(r => (
            <li key={r.id}>
              {r.itemName} - Requested by {r.requestedByName} on {r.requestedAt.toLocaleDateString()} (Status: {r.status})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Reports; 