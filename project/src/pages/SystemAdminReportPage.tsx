import React, { useEffect, useMemo, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const REPORT_OPTIONS = [
  { value: 'new', label: 'New Item Request Report' },
  { value: 'repair', label: 'Repair Request Report' },
];

const STATUS_OPTIONS = {
  new: [
    { value: '', label: 'All Statuses' },
    { value: 'approved', label: 'Approved' },
    { value: 'denied', label: 'Denied' },
    { value: 'pending', label: 'Pending' },
    { value: 'issued', label: 'Issued' },
  ],
  repair: [
    { value: '', label: 'All Statuses' },
    { value: 'damaged', label: 'Damaged' },
    { value: 'pending', label: 'Pending' },
    { value: 'repair_in_process', label: 'Repair in Process' },
    { value: 'repaired', label: 'Repaired' },
  ],
};

const RANGE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

const statusLabel = (status: string) => {
  switch (status) {
    case 'approved': return 'Approved';
    case 'denied': return 'Denied';
    case 'pending': return 'Pending';
    case 'issued': return 'Issued';
    case 'damaged': return 'Damaged';
    case 'repair_in_process': return 'Repair in Process';
    case 'repaired': return 'Repaired';
    default: return status;
  }
};

const SystemAdminReportPage: React.FC = () => {
  console.log("Rendering SystemAdminReportPage");
  const { requests } = useRequestsStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'system-admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const [reportType, setReportType] = useState<'new' | 'repair'>('new');
  const [status, setStatus] = useState('');
  const [range, setRange] = useState('daily');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/items/', { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setItems(data) : setItems([]))
      .catch(() => setItems([]));
  }, []);

  // Filtered requests by type
  const filteredRequests = useMemo(() => {
    let base = requests.filter(r => r.type === reportType);
    if (status) base = base.filter(r => r.status === status);
    // Date filtering
    const now = new Date();
    const normalizeDate = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };
    if (range === 'custom' && customStart && customEnd) {
      const start = normalizeDate(new Date(customStart));
      const end = normalizeDate(new Date(customEnd));
      base = base.filter(r => {
        const dateStr = r.requestedAt || r.created_at;
        if (!dateStr) return true; // If no date, include (legacy behavior)
        const d = normalizeDate(new Date(dateStr));
        return d >= start && d <= end;
      });
    } else if (range === 'daily') {
      const today = normalizeDate(now);
      base = base.filter(r => {
        const dateStr = r.requestedAt || r.created_at;
        if (!dateStr) return true;
        const d = normalizeDate(new Date(dateStr));
        return d.getTime() === today.getTime();
      });
    } else if (range === 'weekly') {
      const today = normalizeDate(now);
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 6);
      base = base.filter(r => {
        const dateStr = r.requestedAt || r.created_at;
        if (!dateStr) return true;
        const d = normalizeDate(new Date(dateStr));
        return d >= weekAgo && d <= today;
      });
    } else if (range === 'monthly') {
      const today = normalizeDate(now);
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      base = base.filter(r => {
        const dateStr = r.requestedAt || r.created_at;
        if (!dateStr) return true;
        const d = normalizeDate(new Date(dateStr));
        return d >= monthAgo && d <= today;
      });
    }
    return base;
  }, [requests, reportType, status, range, customStart, customEnd]);

  function getItemNameAndCategory(request: any) {
    if (reportType === 'repair') {
      const name = request.item_name || (request.issued_item && request.issued_item.item_name) || '-';
      const category = request.item_category || (request.issued_item && request.issued_item.item_category) || '-';
      return { name, category };
    } else {
      const name = request.item_name || request.itemName || '-';
      const category = request.category || '-';
      if (items && items.length > 0 && request.item) {
        const found = items.find((it: any) => it.id === request.item);
        if (found) return { name: found.name, category: found.category };
      }
      return { name, category };
    }
  }

  const getStatusSummary = () => {
    const summary: Record<string, number> = {};
    STATUS_OPTIONS[reportType].filter(opt => opt.value).forEach(opt => {
      summary[opt.label] = filteredRequests.filter(r => r.status === opt.value).length;
    });
    return summary;
  };

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const exportDate = new Date().toLocaleString();
      const adminName = user?.username || user?.name || '-';
      const statusSummary = getStatusSummary();
      const wsData = [
        [`Report exported on: ${exportDate}`],
        [`Exported by: ${adminName}`],
        [`Report type: ${reportType === 'new' ? 'New Item Request Report' : 'Repair Request Report'}`],
        [],
        ['Summary by Status:'],
        ...Object.entries(statusSummary).map(([label, count]) => [`${label}:`, count]),
        ['Total:', filteredRequests.length],
        [],
        [
          'Date of the Request',
          'Category',
          'Item Name',
          ...(reportType === 'new' ? ['Quantity'] : []),
          'Status',
          'Requested By',
        ],
        ...filteredRequests.map(row => {
          const { name, category } = getItemNameAndCategory(row);
          let requestedBy = '-';
          if (row.requestedByName) {
            requestedBy = row.requestedByName;
          } else if (row.requested_by && typeof row.requested_by === 'object') {
            requestedBy = row.requested_by['name'] || row.requested_by['fullName'] || row.requested_by['username'] || '-';
          } else if (row.requested_by) {
            requestedBy = row.requested_by;
          }
          return [
            row.requestedAt ? new Date(row.requestedAt).toLocaleDateString() : (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'),
            category,
            name,
            ...(reportType === 'new' ? [row.quantity || '-'] : []),
            statusLabel(row.status),
            requestedBy,
          ];
        })
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, 'report.xlsx');
    });
  };

  const handleExportPDF = () => {
    const exportDate = new Date().toLocaleString();
    const adminName = user?.username || user?.name || '-';
    const statusSummary = getStatusSummary();
    const doc = new jsPDF();
    doc.text(`Report exported on: ${exportDate}` , 10, 10);
    doc.text(`Exported by: ${adminName}` , 10, 18);
    doc.text(`Report type: ${reportType === 'new' ? 'New Item Request Report' : 'Repair Request Report'}` , 10, 26);
    let y = 34;
    doc.text('Summary by Status:', 10, y);
    y += 8;
    Object.entries(statusSummary).forEach(([label, count]) => {
      doc.text(`${label}: ${count}`, 14, y);
      y += 7;
    });
    doc.text(`Total: ${filteredRequests.length}`, 14, y);
    y += 8;
    const head = [[
      'Date of the Request',
      'Category',
      'Item Name',
      ...(reportType === 'new' ? ['Quantity'] : []),
      'Status',
      'Requested By',
    ]];
    const body = filteredRequests.map(row => {
      const { name, category } = getItemNameAndCategory(row);
      let requestedBy = '-';
      if (row.requestedByName) {
        requestedBy = row.requestedByName;
      } else if (row.requested_by && typeof row.requested_by === 'object') {
        requestedBy = row.requested_by['name'] || row.requested_by['fullName'] || row.requested_by['username'] || '-';
      } else if (row.requested_by) {
        requestedBy = row.requested_by;
      }
      return [
        row.requestedAt ? new Date(row.requestedAt).toLocaleDateString() : (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'),
        category,
        name,
        ...(reportType === 'new' ? [row.quantity || '-'] : []),
        statusLabel(row.status),
        requestedBy,
      ];
    });
    (doc as any).autoTable({ head, body, startY: y });
    doc.save('report.pdf');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{REPORT_OPTIONS.find(opt => opt.value === reportType)?.label}</h1>
      <div className="bg-[#fff] rounded-xl shadow p-6 mb-8">
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1">Report Type</label>
            <select className="border rounded px-2 py-1" value={reportType} onChange={e => { setReportType(e.target.value as 'new' | 'repair'); setStatus(''); }}>
              {REPORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Status</label>
            <select className="border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS[reportType].map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Range</label>
            <select className="border rounded px-2 py-1" value={range} onChange={e => setRange(e.target.value)}>
              {RANGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          {range === 'custom' && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1">Start Date</label>
                <input type="date" className="border rounded px-2 py-1" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">End Date</label>
                <input type="date" className="border rounded px-2 py-1" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
              </div>
            </>
          )}
        </div>
        {/* Report type display */}
        <div className="mb-4 text-lg font-semibold text-blue-700">
          {reportType === 'new' ? 'New Item Request Report' : 'Repair Request Report'}
        </div>
        {/* Status summary */}
        <div className="mb-4">
          <div className="font-semibold mb-1">Summary by Status:</div>
          <div className="flex flex-wrap gap-4">
            {STATUS_OPTIONS[reportType].filter(opt => opt.value).map(opt => {
              const count = filteredRequests.filter(r => r.status === opt.value).length;
              return (
                <div key={opt.value} className="bg-gray-100 px-3 py-1 rounded text-sm">
                  {opt.label}: <span className="font-bold">{count}</span>
                </div>
              );
            })}
            <div className="bg-gray-200 px-3 py-1 rounded text-sm font-semibold">Total: {filteredRequests.length}</div>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            onClick={handleExportExcel}
          >
            Export to Excel
          </button>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            onClick={handleExportPDF}
          >
            Export to PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-black border border-gray-300">
            <thead className="bg-red-100">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-bold uppercase border">Date of the Request</th>
                <th className="px-2 py-1 text-left text-xs font-bold uppercase border">Category</th>
                <th className="px-2 py-1 text-left text-xs font-bold uppercase border">Item Name</th>
                {reportType === 'new' && (
                  <th className="px-2 py-1 text-left text-xs font-bold uppercase border">Quantity</th>
                )}
                <th className="px-2 py-1 text-left text-xs font-bold uppercase border">Status</th>
                <th className="px-2 py-1 text-left text-xs font-bold uppercase border">Requested By</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={reportType === 'new' ? 6 : 5} className="text-center py-4 text-gray-500">No data for selected range.</td>
                </tr>
              ) : (
                filteredRequests.map((row, i) => {
                  const { name, category } = getItemNameAndCategory(row);
                  let requestedBy = '-';
                  if (row.requestedByName) {
                    requestedBy = row.requestedByName;
                  } else if (row.requested_by && typeof row.requested_by === 'object') {
                    requestedBy = row.requested_by['name'] || row.requested_by['fullName'] || row.requested_by['username'] || '-';
                  } else if (row.requested_by) {
                    requestedBy = row.requested_by;
                  }
                  return (
                    <tr key={row.id || i} className="border-b border-gray-300">
                      <td className="px-2 py-1 border">{row.requestedAt ? new Date(row.requestedAt).toLocaleDateString() : (row.created_at ? new Date(row.created_at).toLocaleDateString() : '-')}</td>
                      <td className="px-2 py-1 border">{category}</td>
                      <td className="px-2 py-1 border">{name}</td>
                      {reportType === 'new' && (
                        <td className="px-2 py-1 border text-right">{row.quantity || '-'}</td>
                      )}
                      <td className="px-2 py-1 border">{statusLabel(row.status)}</td>
                      <td className="px-2 py-1 border">{requestedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminReportPage;
