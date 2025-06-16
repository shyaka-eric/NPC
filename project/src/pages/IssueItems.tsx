import { useState, useEffect } from 'react';
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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useSearchParams } from 'react-router-dom';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const IssueItems: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, fetchRequests, issueRequest } = useRequestsStore();
  const { items, fetchItems, updateItem } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();

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
      case 'weekly':
        return { start: startOfWeek(today), end: endOfWeek(today) };
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

  // Helper to check if a date is in range (accepts string or Date)
  const inRange = (dateVal: string | Date | undefined) => {
    if (!dateVal) return false;
    let date: Date;
    if (typeof dateVal === 'string') {
      date = parseISO(dateVal);
    } else {
      date = dateVal;
    }
    return isWithinInterval(date, { start, end });
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchItems(); // Fetch items first
      await fetchRequests(); // Then fetch requests
      setIsLoading(false);
    };
    load();
  }, [fetchRequests, fetchItems, rangeType, customStart, customEnd]); // Added range dependencies

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

  // Show both approved and issued requests (case-insensitive), sorted by latest first
  const visibleRequests = requests
    .filter(request => {
      const status = request.status?.toLowerCase();
      return (status === 'approved' || status === 'issued') && inRange(request.requestedAt || request.createdAt);
    })
    .sort((a, b) => {
      // Use requestedAt for new, createdAt for repair, fallback to id
      const getDate = (req: any) => new Date(req.requestedAt || req.createdAt || 0).getTime();
      return getDate(b) - getDate(a);
    });

  // Pagination logic (10 per page)
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(visibleRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = visibleRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    {
      header: 'Request Date',
      accessor: (request: any) => formatDate(request.requestedAt || request.createdAt)
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
      accessor: (request: any) => request.requestedByName
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

  const handleExportExcel = () => {
    const wsData = [
      ['Request Date', 'Category', 'Item Name', 'Quantity', 'Requested By', 'Status'],
      ...visibleRequests.map(r => [
        formatDate(r.requested_at || r.created_at),
        getItem(r.item)?.category || '-',
        getItem(r.item)?.name || '-',
        r.quantity,
        r.requested_by_name,
        r.status
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Issued Items');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'issued_items_report.xlsx');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Issue Items"
        description="Process and issue approved requests"
      />
      <div className="flex gap-2 mb-4">
        <Button variant="success" onClick={handleExportExcel}>Export to Excel</Button>
      </div>
      <div className="mt-8">
        <Table
          columns={columns}
          data={paginatedRequests}
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
      {/* Pagination Controls */}
      <div className="flex justify-center mt-6">
        {totalPages > 1 && (
          <nav className="inline-flex -space-x-px">
            <button
              className="px-3 py-1 border rounded-l disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                className={`px-3 py-1 border-t border-b ${currentPage === idx + 1 ? 'bg-gray-200 font-bold' : ''}`}
                onClick={() => setCurrentPage(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 border rounded-r disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default IssueItems;