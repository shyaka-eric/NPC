import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';

interface IssuedItem {
  id: number;
  serial_number: string;
  assigned_date: string;
  status?: string;
}

interface RepairRequest {
  id: number;
  item_name: string;
  item_category: string;
  issued_items: IssuedItem[];
}

const RepairRequestDetails: React.FC = () => {
  // Decode params to handle spaces/special characters
  const { itemName: rawItemName, itemCategory: rawItemCategory } = useParams<{ itemName: string; itemCategory: string }>();
  const itemName = rawItemName ? decodeURIComponent(rawItemName) : '';
  const itemCategory = rawItemCategory ? decodeURIComponent(rawItemCategory) : '';
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ensureUserAndFetch = async () => {
      let currentUser = user;
      if (!currentUser) {
        await fetchUser();
        currentUser = useAuthStore.getState().user;
        if (!currentUser) {
          setError('Authentication required. Please log in again.');
          setIsLoading(false);
          return;
        }
      }
      fetchIssuedItems(currentUser);
    };
    ensureUserAndFetch();
    // eslint-disable-next-line
  }, [itemName, itemCategory, user]);

  const fetchIssuedItems = async (currentUser: any) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentUser) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      const response = await axios.get<any[]>(`${API_URL}/api/repair-requests/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { requested_by: currentUser.id },
      });
      // Filter and group by serial number, keeping all statuses for each
      const filtered = response.data.filter(r =>
        r.issued_item?.item_name === itemName && r.issued_item?.item_category === itemCategory
      );
      // For each serial number, collect all requests and pick the latest by created_at
      const serialMap: { [serial: string]: IssuedItem[] } = {};
      filtered.forEach(r => {
        const sn = r.issued_item.serial_number;
        if (!serialMap[sn]) serialMap[sn] = [];
        serialMap[sn].push({
          id: r.issued_item.id,
          serial_number: sn,
          assigned_date: r.created_at,
          status: r.status,
        });
      });
      // For each serial, pick the request with the latest created_at
      const serials: IssuedItem[] = Object.values(serialMap).flatMap(arr => arr);
      setIssuedItems(serials);
      setError(null);
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to fetch issued items');
      }
      console.error('Error fetching issued items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Serial Number', accessor: (i: IssuedItem) => i.serial_number },
    { header: 'Status', accessor: (i: IssuedItem) => {
      switch (i.status) {
        case 'pending': return <span className="text-yellow-600 font-semibold">Pending</span>;
        case 'repair-in-process': return <span className="text-blue-600 font-semibold">Repair In Process</span>;
        case 'repaired': return <span className="text-green-600 font-semibold">Repaired</span>;
        case 'damaged': return <span className="text-red-600 font-semibold">Damaged</span>;
        default: return i.status || '-';
      }
    } },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Item Details"
        description={`Details for issued item group`}
      />
      <div className="mb-4 flex gap-8">
        <div>
          <div className="font-semibold">Item Name</div>
          <div>{itemName}</div>
        </div>
        <div>
          <div className="font-semibold">Category</div>
          <div>{itemCategory}</div>
        </div>
        <div>
          <div className="font-semibold">Quantity</div>
          <div>{issuedItems.length}</div>
        </div>
      </div>
      <div className="mb-4">
        <Table
          columns={columns}
          data={issuedItems}
          keyExtractor={i => i.id.toString()}
          isLoading={isLoading}
          emptyMessage="No serial numbers found."
        />
      </div>
      <button
        className="px-4 py-2 rounded bg-gray-600 text-white font-semibold shadow hover:bg-gray-700 transition-colors duration-150 mt-4"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
    </div>
  );
};

export default RepairRequestDetails;
