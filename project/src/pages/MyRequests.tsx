import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/formatters';
import Pagination from '../components/Pagination';
import SimpleModal from '../components/ui/SimpleModal';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 15;

const MyRequests: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, fetchRequests } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [combinedRequests, setCombinedRequests] = useState<any[]>([]);

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        await fetchItems();
        await fetchRequests(); // updates the store
        setCombinedRequests(requests); // Use only the requests from the store
      } catch (error) {
        toast.error('Failed to load requests');
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, [fetchRequests, fetchItems, requests]);

  // Filter requests for the current user and only show new item requests
  const myRequests = combinedRequests
    .filter(request => request.requested_by === user?.id && request.type === 'new')
    .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  const totalPages = Math.ceil(myRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = myRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  // Helper to safely format dates
  const safeFormatDate = (date: any) => {
    if (!date) return '-';
    try {
      return formatDate(date);
    } catch {
      return '-';
    }
  };

  const columns = [
    {
      header: 'Request Date',
      accessor: (request: any) => safeFormatDate(request.requested_at)
    },
    {
      header: 'Type',
      accessor: (request: any) =>
        request.type
          ? request.type.charAt(0).toUpperCase() + request.type.slice(1)
          : '-'
    },
    {
      header: 'Category',
      accessor: (request: any) => {
        const item = items.find(i => String(i.id) === String(request.item));
        return item?.category || '-';
      }
    },
    {
      header: 'Item',
      accessor: (request: any) => {
        const item = items.find(i => String(i.id) === String(request.item));
        return item?.name || '-';
      }
    },
    {
      header: 'Quantity',
      accessor: 'quantity'
    },
    {
      header: 'Status',
      accessor: (request: any) => <StatusBadge status={request.status} />
    },
    {
      header: 'Actions',
      accessor: (request: any) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleViewRequest(request)}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My Requests"
        description="View and track your item and repair requests"
      />

      <div className="mt-8">
        <Table
          columns={columns}
          data={paginatedRequests}
          keyExtractor={request => request.id}
          isLoading={isLoading}
          emptyMessage="You haven't made any requests yet."
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      </div>

      <SimpleModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Request Details"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Request Type</h3>
                <p className="mt-1">{selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1"><StatusBadge status={selectedRequest.status} /></p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1">{(() => { const item = items.find(i => String(i.id) === String(selectedRequest.item)); return item?.category || '-'; })()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Item Name</h3>
                <p className="mt-1">{(() => { const item = items.find(i => String(i.id) === String(selectedRequest.item)); return item?.name || '-'; })()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                <p className="mt-1">{selectedRequest.quantity}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Request Date</h3>
                <p className="mt-1">{safeFormatDate(selectedRequest.requested_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1">{safeFormatDate(selectedRequest.updated_at)}</p>
              </div>
            </div>
            {selectedRequest.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1">{selectedRequest.notes}</p>
              </div>
            )}
          </div>
        )}
      </SimpleModal>
    </div>
  );
};

export default MyRequests;