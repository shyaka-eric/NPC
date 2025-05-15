import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/formatters';

const ApprovedRequests: React.FC = () => {
  const { requests, fetchRequests, isLoading } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchRequests();
        await fetchItems();
      } catch (err) {
        console.error('Error fetching requests or items:', err);
      }
      setLoading(false);
      // Debug log
      console.log('Fetched requests:', requests);
    };
    load();
  }, [fetchRequests, fetchItems]);

  // Case-insensitive filter for approved and issued requests
  const approvedRequests = requests.filter(r => ['approved', 'issued'].includes(r.status?.toLowerCase()));

  const getCategory = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? item.category : '';
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? item.name : '';
  };

  const columns = [
    { header: 'Date', accessor: (r: any) => formatDate(r.requested_at) },
    { header: 'Category', accessor: (r: any) => getCategory(r.item) },
    { header: 'Item Name', accessor: (r: any) => getItemName(r.item) },
    { header: 'Quantity', accessor: (r: any) => r.quantity },
    { header: 'Requested By', accessor: (r: any) => r.requested_by_name },
    { header: 'Status', accessor: (r: any) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Approved Requests" description="All approved requests ready for processing." />
      <div className="mt-8">
        <Table
          columns={columns}
          data={approvedRequests}
          keyExtractor={r => r.id}
          isLoading={isLoading || loading}
          emptyMessage="No approved requests found."
        />
      </div>
    </div>
  );
};

export default ApprovedRequests;