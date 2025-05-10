import React, { useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/formatters';
import { toast } from 'sonner';

const AdminRequests: React.FC = () => {
  const { requests, approveRequest, denyRequest } = useRequestsStore();
  const { items } = useItemsStore();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'new', label: 'New Item' },
    { value: 'repair', label: 'Repair' },
  ];

  // Only show pending requests
  const filtered = requests.filter(r =>
    r.status === 'pending' &&
    (type ? r.type === type : true) &&
    (search ? r.itemName.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const handleApprove = async (request: any) => {
    // Check stock
    const item = items.find(i => i.name === request.itemName);
    if (!item || item.quantity < request.quantity) {
      toast.error('Not enough stock to approve this request.');
      return;
    }
    try {
      await approveRequest(request.id, '2'); // '2' is admin id placeholder
      toast.success('Request approved.');
    } catch {
      toast.error('Failed to approve request.');
    }
  };

  const handleDeny = async (request: any) => {
    try {
      await denyRequest(request.id, '2', 'Denied by admin');
      toast.success('Request denied.');
    } catch {
      toast.error('Failed to deny request.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Approve Requests" description="View and approve or deny pending requests from unit leaders." />
      <div className="flex gap-4 mb-4">
        <Input placeholder="Search by item..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select name="type" value={type} onChange={e => setType(e.target.value)} options={typeOptions} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Requested By</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filtered.map(request => (
              <tr key={request.id}>
                <td className="px-4 py-2 whitespace-nowrap">{formatDate(request.requestedAt)}</td>
                <td className="px-4 py-2 whitespace-nowrap">{request.itemName}</td>
                <td className="px-4 py-2 whitespace-nowrap">{request.quantity}</td>
                <td className="px-4 py-2 whitespace-nowrap">{request.requestedByName}</td>
                <td className="px-4 py-2 whitespace-nowrap"><StatusBadge status={request.status} /></td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <Button size="sm" variant="success" onClick={() => handleApprove(request)}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeny(request)}>Deny</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRequests; 