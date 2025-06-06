import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import Select from '../components/ui/Select';
import { formatDate } from '../utils/formatters';
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'issued', label: 'Issued' },
  { value: 'completed', label: 'Completed' }
];

const ITEMS_PER_PAGE = 15;

const Requests: React.FC = () => {
  const { requests, fetchRequests, approveRequest, denyRequest } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    request: any | null;
    action: 'approve' | 'reject' | null;
  }>({ open: false, request: null, action: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [editQuantity, setEditQuantity] = useState<number | null>(null);

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

  // Show only new item requests, sorted by latest first
  const filteredRequests = requests
    .filter(r => r.type === 'new' && (statusFilter ? r.status === statusFilter : true))
    .sort((a, b) => {
      // Use requested_at for new, created_at for repair, fallback to id
      const getDate = (req: any) => new Date(req.requested_at || req.created_at || 0).getTime();
      return getDate(b) - getDate(a);
    });

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

  const handleAction = async () => {
    if (!confirmModal.request || !confirmModal.action) return;
    setActionLoading(true);
    try {
      if (confirmModal.action === 'approve') {
        // Use edited quantity if provided, else original
        const quantityToApprove = editQuantity ?? confirmModal.request.quantity;
        await approveRequest(confirmModal.request.id, '', quantityToApprove);
        toast.success('Request approved successfully');
      } else {
        await denyRequest(confirmModal.request.id, '', 'Denied by admin');
        toast.success('Request denied successfully');
      }
    } catch (error) {
      toast.error(
        confirmModal.action === 'approve'
          ? 'Failed to approve request'
          : 'Failed to deny request'
      );
    } finally {
      setActionLoading(false);
      setConfirmModal({ open: false, request: null, action: null });
      setEditQuantity(null);
    }
  };

  const columns = [
    {
      header: 'Request Date',
      accessor: (request: any) => {
        // Use requested_at for new, created_at for repair
        const date = request.requested_at || request.created_at;
        return safeFormatDate(date);
      }
    },
    {
      header: 'Type',
      accessor: (request: any) => request.type.charAt(0).toUpperCase() + request.type.slice(1)
    },
    {
      header: 'Category',
      accessor: (request: any) => {
        if (request.type === 'repair') {
          return request.item_category || (request.issued_item && request.issued_item.item_category) || '-';
        }
        const item = items.find(i => String(i.id) === String(request.item));
        return item?.category || request.category || '-';
      }
    },
    {
      header: 'Item',
      accessor: (request: any) => {
        if (request.type === 'repair') {
          return request.item_name || (request.issued_item && request.issued_item.item_name) || '-';
        }
        const item = items.find(i => String(i.id) === String(request.item));
        return item?.name || request.item_name || '-';
      },
      className: 'font-medium'
    },
    {
      header: 'Quantity',
      accessor: (request: any) => request.type === 'repair' ? 1 : request.quantity
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
      header: 'Available Stock',
      accessor: (request: any) => {
        if (request.type === 'repair') return '-';
        const item = items.find(i => String(i.id) === String(request.item));
        return item ? item.quantity : '-';
      }
    },
    {
      header: 'Actions',
      accessor: (request: any) => {
        if (request.status === 'pending') {
          return (
            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => setConfirmModal({ open: true, request, action: 'approve' })}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmModal({ open: true, request, action: 'reject' })}
              >
                Reject
              </Button>
            </div>
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
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={statusOptions}
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
        open={confirmModal.open}
        onClose={() => {
          setConfirmModal({ open: false, request: null, action: null });
          setEditQuantity(null);
        }}
        title={confirmModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmModal({ open: false, request: null, action: null });
                setEditQuantity(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.action === 'approve' ? 'success' : 'danger'}
              onClick={handleAction}
              isLoading={actionLoading}
            >
              {confirmModal.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        }
      >
        {confirmModal.action === 'approve' ? (
          <div>
            <div className="mb-4">
              <div className="font-semibold mb-2">Item Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-500">Item:</div>
                <div className="font-medium">{(() => {
                  if (confirmModal.request.type === 'repair') {
                    return confirmModal.request.item_name || (confirmModal.request.issued_item && confirmModal.request.issued_item.item_name) || '-';
                  }
                  const item = items.find(i => String(i.id) === String(confirmModal.request.item));
                  return item?.name || confirmModal.request.item_name || '-';
                })()}</div>
                <div className="text-slate-500">Category:</div>
                <div>{(() => {
                  if (confirmModal.request.type === 'repair') {
                    return confirmModal.request.item_category || (confirmModal.request.issued_item && confirmModal.request.issued_item.item_category) || '-';
                  }
                  const item = items.find(i => String(i.id) === String(confirmModal.request.item));
                  return item?.category || confirmModal.request.category || '-';
                })()}</div>
                <div className="text-slate-500">Requested By:</div>
                <div>{confirmModal.request.requested_by_name || confirmModal.request.requested_by || '-'}</div>
                <div className="text-slate-500">Original Quantity:</div>
                <div>{confirmModal.request.quantity}</div>
                <div className="text-slate-500">Available Stock:</div>
                <div>{(() => {
                  if (confirmModal.request.type === 'repair') return '-';
                  const item = items.find(i => String(i.id) === String(confirmModal.request.item));
                  return item ? item.quantity : '-';
                })()}</div>
                <div className="text-slate-500">Edit Quantity:</div>
                <div>
                  <input
                    type="number"
                    min={1}
                    className="border rounded px-2 py-1 w-24"
                    value={editQuantity !== null ? editQuantity : confirmModal.request.quantity}
                    onChange={e => setEditQuantity(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div>Are you sure you want to approve this request?</div>
          </div>
        ) : (
          'Are you sure you want to reject this request?'
        )}
      </SimpleModal>
    </div>
  );
};

export default Requests;