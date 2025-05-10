import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import Select from '../components/ui/Select';
import { formatDate } from '../utils/formatters';
import Pagination from '../components/Pagination';
import SimpleModal from '../components/ui/SimpleModal';
import Button from '../components/ui/Button';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'issued', label: 'Issued' },
  { value: 'completed', label: 'Completed' }
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'new', label: 'New Item' },
  { value: 'repair', label: 'Repair' }
];

const ITEMS_PER_PAGE = 15;

const Requests: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, fetchRequests, approveRequest, denyRequest } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        await fetchRequests();
      } catch (error) {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredRequests = requests.filter(r => {
    return (
      (statusFilter ? r.status === statusFilter : true) &&
      (typeFilter ? r.type === typeFilter : true)
    );
  });

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    try {
      await approveRequest(selectedRequest.id);
      toast.success('Request approved successfully');
      setIsViewModalOpen(false);
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleDenyRequest = async () => {
    if (!selectedRequest) return;
    try {
      await denyRequest(selectedRequest.id);
      toast.success('Request denied successfully');
      setIsViewModalOpen(false);
    } catch (error) {
      toast.error('Failed to deny request');
    }
  };

  // Helper to safely format dates
  const safeFormatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return formatDate(d);
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
      accessor: (request: any) => request.type.charAt(0).toUpperCase() + request.type.slice(1)
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
      },
      className: 'font-medium'
    },
    {
      header: 'Quantity',
      accessor: 'quantity'
    },
    {
      header: 'Requested By',
      accessor: (request: any) => request.requested_by_name || request.requested_by || '-'
    },
    {
      header: 'Status',
      accessor: (request: any) => <StatusBadge status={request.status} />
    },
    {
      header: 'Actions',
      accessor: (request: any) => {
        if (request.status === 'pending') {
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleViewRequest(request)}
            >
              View Details
            </Button>
          );
        } else {
          return <span className="text-slate-400">Completed</span>;
        }
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Requests"
        description="View and filter all item and repair requests"
      />
      <div className="flex gap-4 mb-4">
        <Select
          label="Status"
          name="status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={statusOptions}
        />
        <Select
          label="Type"
          name="type"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          options={typeOptions}
        />
      </div>
      <Table
        columns={columns}
        data={paginatedRequests}
        keyExtractor={request => request.id}
        isLoading={isLoading}
        emptyMessage="No requests found."
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="mt-6"
      />

      <SimpleModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Request Details"
        footer={
          selectedRequest?.status === 'pending' ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="danger"
                icon={<XCircle className="h-4 w-4" />}
                onClick={handleDenyRequest}
              >
                Deny
              </Button>
              <Button
                variant="success"
                icon={<CheckCircle className="h-4 w-4" />}
                onClick={handleApproveRequest}
              >
                Approve
              </Button>
            </div>
          ) : null
        }
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
                <h3 className="text-sm font-medium text-gray-500">Requested By</h3>
                <p className="mt-1">{selectedRequest.requested_by_name || selectedRequest.requested_by || '-'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Request Date</h3>
                <p className="mt-1">{safeFormatDate(selectedRequest.requested_at)}</p>
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

export default Requests; 