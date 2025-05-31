import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';

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
    { header: 'Category', accessor: (r: RepairRequest) => r.issued_item?.item_category || r.issued_item?.item?.category || '-' },
    { header: 'Item Name', accessor: (r: RepairRequest) => r.issued_item?.item_name || r.issued_item?.item?.name || '-' },
    { header: 'Serial Number', accessor: (r: RepairRequest) => r.issued_item?.serial_number || '-' },
    { header: 'Requested By', accessor: (r: RepairRequest) => r.requested_by_name },
    { header: 'Description', accessor: (r: RepairRequest) => r.description },
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
        <Table
          columns={columns}
          data={visibleRequests}
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
    </div>
  );
};

export default RepairInProgress;