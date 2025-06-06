import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface RepairRequest {
  id: number;
  issued_item: {
    id: number;
    serial_number: string;
    item: {
      name: string;
      category: string;
    };
    assigned_to: {
        name: string;
        email: string;
    }
  };
  description: string;
  status: 'pending' | 'repaired' | 'damaged' | 'repair-in-process';
  created_at: string;
  requested_by_name: string;
}

const RepairInProgress: React.FC = () => {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<RepairRequest | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchRepairInProgressRequests();
  }, []);

  const fetchRepairInProgressRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      const response = await axios.get<RepairRequest[]>(`${API_URL}/api/repair-requests/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { status: 'repair-in-process' } // Filter by status
      });
      setRepairRequests(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch repair in progress requests');
      console.error('Error fetching repair in progress requests:', err);
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
      await axios.patch(`${API_URL}/api/repair-requests/${request.id}/mark_repaired/`, {}, {
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
    { header: 'Category', accessor: (r: RepairRequest) => r.issued_item?.item?.category || '-' },
    { header: 'Item Name', accessor: (r: RepairRequest) => r.issued_item?.item?.name || '-' },
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

  // Only show 'repair-in-process' items for everyone (not just logistic officers)
  const visibleRequests = repairRequests.filter(r => r.status === 'repair-in-process');

  // Pagination logic (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(visibleRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = visibleRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExportExcel = () => {
    const wsData = [
      ['Request Date', 'Category', 'Item Name', 'Serial Number', 'Requested By', 'Status', 'Description'],
      ...repairRequests.map(r => [
        format(new Date(r.created_at), 'yyyy-MM-dd'),
        r.issued_item?.item?.category || '-',
        r.issued_item?.item?.name || '-',
        r.issued_item?.serial_number || '-',
        r.requested_by_name,
        r.status,
        r.description
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Repair In Progress');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'repair_in_progress_report.xlsx');
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
        <div className="flex gap-2 mb-4">
          <Button variant="success" onClick={handleExportExcel}>Export to Excel</Button>
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
            <p className="mb-6">Are you sure you want to mark <span className="font-bold">{confirmRequest.issued_item.item?.name}</span> as repaired?</p>
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
    </div>
  );
};

export default RepairInProgress;