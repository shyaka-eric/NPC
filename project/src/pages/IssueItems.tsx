import React, { useState, useEffect } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/formatters';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const IssueItems: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, fetchRequests, issueRequest } = useRequestsStore();
  const { items, fetchItems, updateItem } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchRequests();
      await fetchItems();
      setIsLoading(false);
      // Debug log
      console.log('Fetched requests:', requests);
    };
    load();
  }, [fetchRequests, fetchItems]);

  const getItem = (itemId: number) => items.find(i => i.id === itemId);

  const handleIssueItem = async (request: any) => {
    if (!user) return;
    const item = getItem(request.item);
    if (!item || item.quantity < request.quantity) {
      toast.error('Not enough stock to issue this item.');
      return;
    }
    try {
      // 1. Mark request as issued
      await issueRequest(request.id, user.id);
      // 2. Reduce item quantity and set status to in-use, assign to requester
      await updateItem(item.id, {
        quantity: item.quantity - request.quantity,
        status: 'in-use',
        assigned_to: request.requested_by
      });
      // 3. Re-fetch requests to update the table
      await fetchRequests();
      toast.success('Item issued successfully');
    } catch (error) {
      toast.error('Failed to issue item');
    }
  };

  // Show both approved and issued requests (case-insensitive)
  const visibleRequests = requests.filter(request => {
    const status = request.status?.toLowerCase();
    return status === 'approved' || status === 'issued';
  });

  const columns = [
    {
      header: 'Request Date',
      accessor: (request: any) => formatDate(request.requested_at)
    },
    {
      header: 'Category',
      accessor: (request: any) => getItem(request.item)?.category || ''
    },
    {
      header: 'Item',
      accessor: (request: any) => getItem(request.item)?.name || ''
    },
    {
      header: 'Quantity',
      accessor: 'quantity'
    },
    {
      header: 'Requested By',
      accessor: 'requested_by_name'
    },
    {
      header: 'Status',
      accessor: (request: any) => <StatusBadge status={request.status} />
    },
    {
      header: 'Actions',
      accessor: (request: any) => (
        <Button
          variant="success"
          size="sm"
          icon={<CheckCircle className="h-4 w-4" />}
          onClick={() => handleIssueItem(request)}
          disabled={request.status === 'issued'}
        >
          {request.status === 'issued' ? 'Issued' : 'Issue'}
        </Button>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Issue Items"
        description="Process and issue approved requests"
      />

      <div className="mt-8">
        <Table
          columns={columns}
          data={visibleRequests}
          keyExtractor={(request) => request.id}
          isLoading={isLoading}
          emptyMessage="No approved or issued requests to process"
        />
      </div>
    </div>
  );
};

export default IssueItems;