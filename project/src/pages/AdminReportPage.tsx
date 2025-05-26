import React, { useEffect, useMemo, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

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

const AdminReportPage: React.FC = () => {
  const { requests } = useRequestsStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const [reportType, setReportType] = useState<'new' | 'repair'>('new');
  const [status, setStatus] = useState('');
  const [range, setRange] = useState('daily');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    setLoadingItems(true);
    fetch('http://localhost:8000/api/items/')
      .then(res => res.ok ? res.json() : [])
      .then(data => Array.isArray(data) ? setItems(data) : setItems([]))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, []);

  // Filtered requests by type
  const filteredRequests = useMemo(() => {
    let base = requests.filter(r => r.type === reportType);
    if (status) base = base.filter(r => r.status === status);
    // Date filtering
    if (range === 'custom' && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      base = base.filter(r => {
        const d = new Date(r.requestedAt || Date.now());
        return d >= start && d <= end;
      });
    }
    // For demo, just return all for other ranges
    return base;
  }, [requests, reportType, status, range, customStart, customEnd]);

  function getItemNameAndCategory(request: any) {
    if (reportType === 'repair') {
      // Prefer top-level fields, then issued_item, then fallback
      const name = request.item_name || (request.issued_item && request.issued_item.item_name) || '-';
      const category = request.item_category || (request.issued_item && request.issued_item.item_category) || '-';
      return { name, category };
    } else {
      // For 'new' requests
      const name = request.item_name || request.itemName || '-';
      const category = request.category || '-';
      if (items && items.length > 0 && request.item) {
        const found = items.find((it: any) => it.id === request.item);
        if (found) return { name: found.name, category: found.category };
      }
      return { name, category };
    }
  }

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
              {filteredRequests.map((row, i) => {
                const { name, category } = getItemNameAndCategory(row);
                let requestedBy = '-';
                if (row.requested_by_name) {
                  requestedBy = row.requested_by_name;
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReportPage;
