import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/formatters';

const PendingRequests: React.FC = () => {
  const { requests, fetchRequests } = useRequestsStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      setLoading(true);
      try {
        await fetchRequests();
        console.log('Fetched requests:', requests);
        console.log('Logged-in user:', user);
        const filteredRequests = requests.filter(
          req => req.status === 'pending' && req.requestedBy === user?.id
        );
        console.log('Filtered pending requests:', filteredRequests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [fetchRequests, requests, user]);

  // Show all pending requests, both new and repair
  const pendingRequests = requests.filter(req => req.status === 'pending');

  console.log('Pending Requests Data:', pendingRequests);

  const columns = [
    { header: 'Date', accessor: (req: any) => formatDate(req.requested_at) || '-' },
    { header: 'Type', accessor: (req: any) => req.type || '-' },
    { header: 'Category', accessor: (req: any) => req.category || '-' },
    { header: 'Item', accessor: (req: any) => req.item_name || '-' },
    { header: 'Quantity', accessor: (req: any) => req.quantity?.toString() || '0' },
    { header: 'Requested By', accessor: (req: any) => req.requested_by_name || '-' },
    { header: 'Status', accessor: (req: any) => <StatusBadge status={req.status} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Pending Requests" description="View all your pending requests." />
      <div className="mt-8">
        <Table
          columns={columns}
          data={pendingRequests}
          keyExtractor={req => req.id}
          isLoading={loading}
          emptyMessage="No pending requests found."
        />
      </div>
    </div>
  );
};

export default PendingRequests;
