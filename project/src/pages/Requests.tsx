import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/formatters';
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';
import { useSearchParams } from 'react-router-dom';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import Toggle from '../components/ui/Toggle';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 15;

const Requests: React.FC = () => {
  const { requests, fetchRequests, approveRequest, denyRequest } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    request: any | null;
    action: 'approve' | 'reject' | null;
  }>({ open: false, request: null, action: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [editQuantity, setEditQuantity] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const [isFilteredView, setIsFilteredView] = useState(true);

  // Get range parameters from URL
  const rangeType = (searchParams.get('rangeType') as 'daily' | 'weekly' | 'monthly' | 'custom') || 'daily';
  const customStart = searchParams.get('customStart') || '';
  const customEnd = searchParams.get('customEnd') || '';
  const today = new Date();

  // Helper to get date range
  const getRange = () => {
    switch (rangeType) {
      case 'daily':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'weekly': {
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });
        const previousWeekStart = new Date(start.setDate(start.getDate() - 7));
        const previousWeekEnd = new Date(end.setDate(end.getDate() - 7));
        console.log('Previous weekly range start:', previousWeekStart, 'Previous weekly range end:', previousWeekEnd);
        return { start: previousWeekStart, end: previousWeekEnd };
      }
      case 'monthly':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        if (customStart && customEnd) {
          return { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) };
        }
        return { start: startOfDay(today), end: endOfDay(today) };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };
  const { start, end } = getRange();

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        // Fetch both requests and items
        await Promise.all([
          fetchRequests(),
          fetchItems() // Ensure items are fetched as well
        ]);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, [fetchRequests, fetchItems, rangeType, customStart, customEnd, isFilteredView]); // Added range dependencies

  console.log('Requests data:', requests);

  // Filter requests by date range
  const filteredRequests = isFilteredView
    ? requests.filter(request => {
        const dateToCheck = request.requestedAt || request.created_at;
        const requestDate = typeof dateToCheck === 'string' ? parseISO(dateToCheck) : dateToCheck;
        const isInRange = isWithinInterval(requestDate, { start, end });
        const isNewRequest = request.type === 'new';
        return isInRange && isNewRequest;
      })
    : requests.filter(request => request.type === 'new');

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

  const exportReport = () => {
    const workbook = XLSX.utils.book_new();
    const sheetData = [
      ['Requests Report'],
      [`Exported Date: ${formatDate(new Date())}`],
      ['Request Date', 'Type', 'Category', 'Item', 'Quantity', 'Requested By', 'Status', 'Available Stock'],
      ...filteredRequests.map(request => [
        safeFormatDate(request.requestedAt || request.created_at),
        request.type.charAt(0).toUpperCase() + request.type.slice(1),
        request.type === 'repair' ? request.item_category || (request.issued_item && request.issued_item.item_category) || '-' : items.find(i => String(i.id) === String(request.itemId))?.category || request.category || '-',
        request.type === 'repair' ? request.item_name || (request.issued_item && request.issued_item.item_name) || '-' : items.find(i => String(i.id) === String(request.itemId))?.name || request.item_name || '-',
        request.type === 'repair' ? 1 : request.quantity,
        request.requestedByName || request.requestedBy || '-',
        request.status,
        request.type === 'repair' ? '-' : items.find(i => String(i.id) === String(request.itemId))?.quantity || '-'
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Requests_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const columns = [
    {
      header: 'Request Date',
      accessor: (request: any) => {
        const date = request.requestedAt || request.createdAt;
        return safeFormatDate(date);
      }
    },
    {
      header: 'Type',
      accessor: (request: any) => request.type.charAt(0).toUpperCase() + request.type.slice(1)
    },
    {
      header: 'Category',
      accessor: (request: any) => request.category || '-'
    },
    {
      header: 'Item',
      accessor: (request: any) => request.item_name || '-'
    },
    {
      header: 'Quantity',
      accessor: (request: any) => request.quantity
    },
    {
      header: 'Requested By',
      accessor: (request: any) => request.requested_by_name || '-'
    },
    {
      header: 'Status',
      accessor: (request: any) => <StatusBadge status={request.status} />
    },
    {
      header: 'Available Stock',
      accessor: (request: any) => {
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={exportReport}
          >
            Export Report
          </Button>
        </div>
        {/* Move Filtered View toggle to the right */}
        <div className="flex items-center gap-4">
          <Toggle
            label="Filtered View"
            isChecked={isFilteredView}
            onChange={() => setIsFilteredView(!isFilteredView)}
          />
        </div>
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