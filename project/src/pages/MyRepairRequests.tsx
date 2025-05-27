import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';
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

const MyRepairRequests: React.FC = () => {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyRepairRequests();
    // eslint-disable-next-line
  }, []);

  const fetchMyRepairRequests = async () => {
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
      // Group by item_name + item_category
      const grouped: { [key: string]: any } = {};
      response.data.forEach(req => {
        const key = `${req.issued_item.item_name}|||${req.issued_item.item_category}`;
        if (!grouped[key]) {
          grouped[key] = {
            item_name: req.issued_item.item_name,
            item_category: req.issued_item.item_category,
            serial_numbers: [req.issued_item.serial_number],
            descriptions: [req.description],
            statuses: [req.status],
            created_ats: [req.created_at],
          };
        } else {
          grouped[key].serial_numbers.push(req.issued_item.serial_number);
          grouped[key].descriptions.push(req.description);
          grouped[key].statuses.push(req.status);
          grouped[key].created_ats.push(req.created_at);
        }
      });
      setGroupedRequests(Object.values(grouped));
      setError(null);
    } catch (err) {
      setError('Failed to fetch your repair requests');
      console.error('Error fetching my repair requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Request Date', accessor: (g: any) => g.created_ats[0] ? format(new Date(g.created_ats[0]), 'MMM dd, yyyy') : '-' },
    { header: 'Category', accessor: (g: any) => g.item_category },
    { header: 'Item Name', accessor: (g: any) => g.item_name },
    { header: 'Quantity', accessor: (g: any) => g.serial_numbers.length },
    { header: 'Actions', accessor: (g: any) => (
      <button
        className="px-2 py-2 rounded bg-gray-600 text-white font-semibold shadow hover:bg-gray-700 transition-colors duration-150"
        onClick={() => {
          navigate(`/repair-request-details/${encodeURIComponent(g.item_name)}/${encodeURIComponent(g.item_category)}`);
        }}
      >
        View Details
      </button>
    ) },
  ];

  const keyExtractor = (g: any) => `${g.item_name}|||${g.item_category}`;

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
        title="My Repair Requests"
        description="Track the status of your repair requests."
      />
      <div className="mt-8">
        <Table
          columns={columns}
          data={groupedRequests}
          keyExtractor={keyExtractor}
          isLoading={isLoading}
          emptyMessage="You have no repair requests."
        />
      </div>
    </div>
  );
};

export default MyRepairRequests;
