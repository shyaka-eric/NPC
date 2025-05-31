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
  const [confirmRequest, setConfirmRequest] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchItems(); // Fetch items first
      await fetchRequests(); // Then fetch requests
      setIsLoading(false);
    };
    load();
  }, [fetchRequests, fetchItems]);

  const getItem = (itemId: any) => items.find(i => String(i.id) === String(itemId));

  const handleIssueItem = async (request: any) => {
    if (!user) return;
    setIsLoading(true); // Prevent double actions
    await fetchItems(); // Always get latest items before issuing
    const item = getItem(request.item);
    if (!item || item.quantity < request.quantity) {
      toast.error('Not enough stock to issue this item.');
      setIsLoading(false);
      return;
    }
    try {
      await issueRequest(request.id, user.id);
      await updateItem(item.id, {
        quantity: item.quantity - request.quantity,
        status: 'in-use',
        assignedTo: request.requested_by
      });
      await fetchItems(); // Refresh items after update
      await fetchRequests(); // Refresh requests after update
      toast.success('Item issued successfully');
    } catch (error) {
      toast.error('Failed to issue item');
    } finally {
      setIsLoading(false);
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
      accessor: (request: any) => request.quantity
    },
    {
      header: 'Requested By',
      accessor: (request: any) => request.requested_by_name
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
          onClick={() => setConfirmRequest(request)}
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
      {/* Confirmation Modal */}
      {confirmRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Issue</h2>
            <p className="mb-6">Are you sure you want to issue <span className="font-bold">{getItem(confirmRequest.item)?.name}</span> (Qty: {confirmRequest.quantity}) to <span className="font-bold">{confirmRequest.requested_by_name}</span>?</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={async () => {
                  await handleIssueItem(confirmRequest);
                  setConfirmRequest(null);
                }}
              >
                Yes, Issue Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueItems;