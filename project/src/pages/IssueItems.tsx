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
import { parseISO } from 'date-fns';

const IssueItems: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, fetchRequests, issueRequest } = useRequestsStore();
  const { items, fetchItems, updateItem } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const [filteredView, setFilteredView] = useState(true);

  // Get dashboard-driven range (from URL params only)
  const urlStart = searchParams.get('customStart');
  const urlEnd = searchParams.get('customEnd');
  const rangeType = searchParams.get('rangeType');
  let start = urlStart ? parseISO(urlStart) : null;
  let end = urlEnd ? parseISO(urlEnd) : null;
  if ((!start || !end) && rangeType === 'daily') {
    const today = new Date();
    start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchItems();
      await fetchRequests();
      setIsLoading(false);
    };
    load();
  }, [fetchRequests, fetchItems]); // Remove range dependencies

  const getItem = (itemId: any) => {
    if (itemId === null || itemId === undefined) {
      console.warn('getItem: itemId is null or undefined', itemId);
      return undefined;
    }
    const idStr = String(itemId);
    const item = items.find(i => String(i.id) === idStr);
    if (!item) {
      console.warn(`getItem: Item with ID ${itemId} not found in items`, items);
    }
    return item;
  };

  const handleIssueItem = async (request: any) => {
    if (!user) return;
    setIsLoading(true); // Prevent double actions
    await fetchItems(); // Always get latest items before issuing
    // Debug: print the full request object and possible item ID fields
    console.log('DEBUG: request object', request);
    const item = getItem(request.itemId ?? request.item); // Support both itemId and item
    if (!item || item.quantity < request.quantity) {
      toast.error('Not enough stock to issue this item.');
      setIsLoading(false);
      return;
    }
    const originalQuantity = item.quantity; // Store the original quantity before issuing
    try {
      await issueRequest(request.id, user.id);
      // After issuing, always use the original quantity minus the issued amount
      const newQuantity = originalQuantity - (request.quantity ?? 1);
      await updateItem(item.id, {
        quantity: newQuantity,
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
  const allVisibleRequests = requests
    .filter(request => {
      const status = request.status?.toLowerCase();
      return status === 'approved' || status === 'issued';
    })
    .sort((a, b) => {
      const getDate = (req: any) => new Date(req.requestedAt || req.createdAt || req.created_at || 0).getTime();
      return getDate(b) - getDate(a);
    });

  // Filter by dashboard range only if Filtered View is ON
  const visibleRequests = filteredView && start && end
    ? allVisibleRequests.filter(request => {
        const dateVal = request.requestedAt || request.created_at;
        if (!dateVal) return false;
        let date: Date;
        if (typeof dateVal === 'string') {
          try {
            date = parseISO(dateVal);
            if (isNaN(date.getTime())) return false;
          } catch {
            return false;
          }
        } else {
          date = dateVal;
        }
        return date >= start && date <= end;
      })
    : (filteredView ? [] : allVisibleRequests);

  // Pagination logic (10 per page)
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(visibleRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = visibleRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    {
      header: 'Request Date',
      accessor: (request: any) => formatDate(request.requestedAt || request.createdAt || request.created_at || '-')
    },
    {
      header: 'Category',
      accessor: (request: any) => {
        // Try both itemId and item fields for lookup
        const item = getItem(request.itemId ?? request.item);
        return item?.category || request.category || 'N/A';
      }
    },
    {
      header: 'Item',
      accessor: (request: any) => {
        const item = getItem(request.itemId ?? request.item);
        return item?.name || request.item_name || request.itemName || 'N/A';
      }
    },
    {
      header: 'Quantity',
      accessor: (request: any) => request.quantity ?? '-'
    },
    {
      header: 'Available Quantity',
      accessor: (request: any) => {
        const item = getItem(request.itemId ?? request.item);
        return (item && typeof item.quantity !== 'undefined') ? item.quantity : (request.available_quantity ?? 'N/A');
      }
    },
    {
      header: 'Requested By',
      accessor: (request: any) => request.requestedByName || '-'
    },
    {
      header: 'Status',
      accessor: (request: any) => <StatusBadge status={request.status || '-'} />
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
    // Prepare header rows
    const exportDate = formatDate(new Date());
    const wsData = [
      ['Issued Items Report'],
      [`Exported: ${exportDate}`],
      [
        'Request Date',
        'Category',
        'Item',
        'Quantity',
        'Available Quantity',
        'Requested By',
        'Status'
      ],
      ...visibleRequests.map(r => {
        const item = getItem(r.itemId);
        const category = item?.category || '-';
        return [
          formatDate(r.requestedAt || r.created_at || '-'),
          category,
          item?.name || r.itemName || '-',
          r.quantity ?? '-',
          item?.quantity ?? '-',
          r.requestedByName || '-',
          r.status || '-'
        ];
      })
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Merge title and export date rows across all columns
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }
    ];
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
      <div className="flex gap-2 mb-4 items-center justify-between">
        {/* Export button left-aligned and blue */}
        <Button variant="primary" onClick={handleExportExcel} className="mr-4">Export Report</Button>
        <div className="flex items-center gap-2 ml-auto">
          <span>Filtered View</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filteredView}
              onChange={e => setFilteredView(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all duration-200"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>
      {/* Remove local range selection UI */}
      {/* {filteredView && (
        <div className="flex gap-4 mb-4 items-center">
          ...range UI...
        </div>
      )} */}
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
            <p className="mb-6">Are you sure you want to issue <span className="font-bold">{getItem(confirmRequest.itemId)?.name}</span> (Qty: {confirmRequest.quantity}) to <span className="font-bold">{confirmRequest.requestedByName}</span>?</p>
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