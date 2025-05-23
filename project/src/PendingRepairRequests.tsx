import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageHeader from './components/PageHeader';
import Table from './components/ui/Table';
import { useAuthStore } from './store/authStore';
import { API_URL } from './config';
import { useNavigate } from 'react-router-dom';

interface IssuedItem {
  id: number;
  serial_number: string;
  item: number;
  item_name: string;
  item_category: string;
}

interface RepairRequest {
  id: number;
  issued_item: IssuedItem;
  description: string;
  status: 'pending' | 'repaired' | 'damaged' | 'repair-in-process';
  created_at: string;
}

const PendingRepairRequests: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<RepairRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingRepairRequests();
    // eslint-disable-next-line
  }, []);

  const fetchPendingRepairRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      const response = await axios.get<RepairRequest[]>(`${API_URL}/api/repair-requests/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { requested_by: user.id },
      });
      // Only show pending repair requests for this user
      const pending = (response.data as any[]).filter(r => r.status === 'pending' && r.type === 'repair' && r.requested_by === user.id);
      setPendingRequests(pending);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pending repair requests');
      console.error('Error fetching pending repair requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Request Date', accessor: (r: RepairRequest) => new Date(r.created_at).toLocaleDateString() },
    { header: 'Category', accessor: (r: RepairRequest) => r.issued_item?.item_category || '-' },
    { header: 'Item Name', accessor: (r: RepairRequest) => r.issued_item?.item_name || '-' },
    { header: 'Serial Number', accessor: (r: RepairRequest) => r.issued_item?.serial_number || '-' },
    { header: 'Description', accessor: (r: RepairRequest) => r.description },
  ];

  const keyExtractor = (r: RepairRequest) => r.id.toString();

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Pending Repair Requests"
        description="All your pending repair requests."
      />
      <Table
        columns={columns}
        data={pendingRequests}
        keyExtractor={keyExtractor}
        isLoading={isLoading}
        emptyMessage="You have no pending repair requests."
      />
    </div>
  );
};

export default PendingRepairRequests;
