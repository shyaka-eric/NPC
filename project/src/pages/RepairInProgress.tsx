import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, startOfDay, endOfDay, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SimpleModal from '../components/ui/SimpleModal';
import Input from '../components/ui/Input';

interface RepairRequest {
  id: number;
  issued_item?: {
    id: number;
    serial_number: string;
    item: number;
    item_name: string;
    item_category: string;
  } | null;
  description: string | null;
  status: 'pending' | 'repaired' | 'damaged' | 'repair-in-process' | 'approved' | 'issued' | 'denied';
  created_at: string;
  item_name: string;
  category: string;
  quantity: number;
  requested_by: number;
  requested_by_name: string;
  type: 'new' | 'repair';
}

const RepairInProgress: React.FC = () => {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<RepairRequest | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [filteredView, setFilteredView] = useState(true);

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
        return { start: startOfDay(today), end: endOfWeek(today) };
      case 'monthly':
        return { start: startOfDay(today), end: endOfMonth(today) };
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
    fetchRepairInProgressRequests();
  }, [user, rangeType, customStart, customEnd]); // Added range dependencies and user

  const fetchRepairInProgressRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      const response = await axios.get<RepairRequest[]>(`${API_URL}/repair-requests/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Filter for 'repair-in-process' status and by date range
      const filteredData = response.data.filter(req => 
        req.status === 'repair-in-process' && inRange(req.created_at)
      );
      setRepairRequests(filteredData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch repair in process requests');
      console.error('Error fetching repair in process requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRepaired = async (request: RepairRequest) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      await axios.patch(`${API_URL}/repair-requests/${request.id}/mark_repaired/`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Item marked as repaired.');
      await fetchRepairInProgressRequests();
    } catch (error) {
      console.error('Error marking item as repaired:', error);
      toast.error('Failed to mark item as repaired.');
    }
  };

  // Use the correct UserRole value for logistic officer
  const isLogisticOfficer = user?.role === 'logistics-officer';

  const columns = [
    { header: 'Request Date', accessor: (r: RepairRequest) => format(new Date(r.created_at), 'MMM dd, yyyy') },
    { header: 'Category', accessor: (r: RepairRequest) => r.category || r.issued_item?.item_category || '-' },
    { header: 'Item Name', accessor: (r: RepairRequest) => r.item_name || r.issued_item?.item_name || '-' },
    { header: 'Serial Number', accessor: (r: RepairRequest) => r.issued_item?.serial_number || '-' },
    { header: 'Requested By', accessor: (r: RepairRequest) => r.requested_by_name },
    { header: 'Status', accessor: (r: RepairRequest) => r.status },
    {
      header: 'Actions',
      accessor: (r: RepairRequest) => {
        if (isLogisticOfficer && r.status === 'repair-in-process') {
          return (
            <Button
              size="sm"
              variant="success"
              onClick={() => setConfirmRequest(r)}
              disabled={r.status !== 'repair-in-process'}
            >
              Mark as Repaired
            </Button>
          );
        }
        return null;
      }
    }
  ];

  const keyExtractor = (r: RepairRequest) => r.id.toString();

  // Filtered View logic for repair-in-process requests
  const allRepairRequests = repairRequests.filter(r => r.status === 'repair-in-process');
  const visibleRequests = filteredView && start && end
    ? allRepairRequests.filter(request => {
        const dateVal = request.created_at;
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
    : (filteredView ? [] : allRepairRequests);

  // Pagination logic (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(visibleRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = visibleRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExportExcel = () => {
    const wsData = [
      ['Request Date', 'Category', 'Item Name', 'Serial Number', 'Requested By', 'Status'], // Removed 'Description'
      ...repairRequests.map(r => [
        format(new Date(r.created_at), 'yyyy-MM-dd'),
        r.category || r.issued_item?.item_category || '-',
        r.item_name || r.issued_item?.item_name || '-',
        r.issued_item?.serial_number || '-',
        r.requested_by_name,
        r.status
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Repair In Progress');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'repair_in_progress_report.xlsx');
  };

  const handleUpdateStatus = async (requestId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found.');
        return;
      }

      await axios.put(`${API_URL}/repair-requests/${requestId}/`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Request ${requestId} status updated to ${newStatus}`);
      fetchRepairInProgressRequests(); // Re-fetch to update the list
      setIsModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to update request status');
      console.error('Error updating request status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Repair In Process"
        description={isLogisticOfficer
          ? "Track and manage items currently undergoing repair."
          : "View items currently undergoing repair."}
      />
      <div className="mt-8">
        <div className="flex gap-2 mb-4 items-center justify-between">
          <Button variant="success" onClick={handleExportExcel}>Export to Excel</Button>
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
        <Table
          columns={columns}
          data={paginatedRequests}
          keyExtractor={keyExtractor}
          isLoading={isLoading}
          emptyMessage="No items currently in repair."
        />
      </div>
      {/* Confirmation Modal */}
      {confirmRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Action</h2>
            <p className="mb-6">Are you sure you want to mark <span className="font-bold">{confirmRequest.item_name || confirmRequest.issued_item?.item_name}</span> as repaired?</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmRequest(null)}>
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={async () => {
                  await handleMarkAsRepaired(confirmRequest);
                  setConfirmRequest(null);
                }}
              >
                Yes, Mark as Repaired
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

      {selectedRequest && (
        <SimpleModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Update Repair Request Status"
        >
          <div className="space-y-4">
            <p><strong>Item:</strong> {selectedRequest.item_name || selectedRequest.issued_item?.item_name}</p>
            <p><strong>Serial:</strong> {selectedRequest.issued_item?.serial_number}</p>
            <p><strong>Description:</strong> {selectedRequest.description}</p>
            <p><strong>Current Status:</strong> {selectedRequest.status}</p>
            <div>
              <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700">Set New Status:</label>
              <select
                id="newStatus"
                name="newStatus"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                defaultValue={selectedRequest.status}
                onChange={(e) => {
                  if (selectedRequest) {
                    setSelectedRequest({ ...selectedRequest, status: e.target.value as any });
                  }
                }}
              >
                <option value="repair-in-process">Repair In Process</option>
                <option value="repaired">Repaired</option>
                <option value="unrepairable">Unrepairable</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={() => handleUpdateStatus(selectedRequest.id, selectedRequest.status)}
              >
                Update Status
              </Button>
            </div>
          </div>
        </SimpleModal>
      )}
    </div>
  );
};

export default RepairInProgress;