import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, startOfDay, endOfWeek, startOfMonth, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { startOfWeek, endOfMonth } from 'date-fns';
import Toggle from '../components/ui/Toggle';

interface IssuedItem {
  id: number;
  serial_number: string;
  item: number;
  item_name: string;
  item_category: string;
}

interface RepairRequest {
  id: number;
  issued_item?: IssuedItem | null;
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

const MyRepairRequests: React.FC = () => {
  const [groupedRequests, setGroupedRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();
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
    fetchMyRepairRequests();
  }, [user, rangeType, customStart, customEnd]); // Added range dependencies and user

  // Helper to get grouped value safely
  const getFirst = (g: any, key: string) => (g.requests && g.requests.length > 0 && g.requests[0][key]) ? g.requests[0][key] : '-';

  // Ensure all repair requests are fetched when the toggle is off
  const fetchMyRepairRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setIsLoading(false);
        return;
      }
      const response = await axios.get<RepairRequest[]>(`${API_URL}/api/repair-requests/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { requested_by: user.id },
      });

      const responseData = isFilteredView
        ? response.data.filter(req => inRange(req.created_at))
        : response.data; // Fetch all repair requests when toggle is off

      const grouped: { [key: string]: any } = {};
      responseData.forEach(req => {
        const key = `${req.item_name}|||${req.category}`;
        if (!grouped[key]) {
          grouped[key] = {
            item_name: req.item_name,
            item_category: req.category,
            serial_numbers: req.issued_item ? [req.issued_item.serial_number] : [],
            descriptions: req.description ? [req.description] : [],
            statuses: [req.status],
            created_ats: [req.created_at],
            // Store individual request details for the modal if needed later
            requests: [req],
          };
        } else {
          if (req.issued_item) {
             grouped[key].serial_numbers.push(req.issued_item.serial_number);
          }
          if (req.description) {
             grouped[key].descriptions.push(req.description);
          }
          grouped[key].statuses.push(req.status);
          grouped[key].created_ats.push(req.created_at);
          // Store individual request details for the modal
          grouped[key].requests.push(req);
        }
      });
      setGroupedRequests(Object.values(grouped));
    } catch (err) {
      console.error('Error fetching my repair requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Request Date', accessor: (g: any) => g.created_ats[0] ? format(new Date(g.created_ats[0]), 'MMM dd, yyyy') : '-' },
    { header: 'Category', accessor: (g: any) => getFirst(g, 'item_category') || g.item_category || '-' },
    { header: 'Item Name', accessor: (g: any) => getFirst(g, 'item_name') || g.item_name || '-' },
    { header: 'Quantity', accessor: (g: any) => g.requests.reduce((sum: number, r: any) => sum + (r.quantity || 1), 0) },
    { header: 'Actions', accessor: (g: any) => (
      <button
        className="px-2 py-2 rounded bg-gray-600 text-white font-semibold shadow hover:bg-gray-700 transition-colors duration-150"
        onClick={() => {
          navigate(`/repair-request-details/${encodeURIComponent(getFirst(g, 'item_name') || g.item_name)}/${encodeURIComponent(getFirst(g, 'item_category') || g.item_category)}`, { state: { groupedRequest: g } });
        }}
      >
        View Details
      </button>
    ) },
  ];

  const keyExtractor = (g: any) => `${g.item_name}|||${g.item_category}`;

  // Fix logic to ensure all items are displayed when the toggle is off
  const repairRequestsToDisplay = isFilteredView
    ? groupedRequests.filter(request => {
        if (!request.created_ats || request.created_ats.length === 0) return false; // Ensure created_ats is defined and not empty
        const isInRange = isWithinInterval(parseISO(request.created_ats[0]), getRange());
        return isInRange;
      })
    : groupedRequests; // Show all grouped requests when toggle is off

  // Add export report button
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="My Repair Requests"
        description="Track the status of your repair requests."
      />
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => {
            // Ensure all columns are populated in the exported report
            const exportedData = repairRequestsToDisplay.map(request => ({
              CreatedAt: request.created_ats[0] || '-',
              SerialNumber: request.serial_numbers[0] || '-',
              ItemName: request.item_name || '-',
              Category: request.item_category || getFirst(request, 'item_category') || '-',
              Quantity: request.requests.reduce((sum: number, r: any) => sum + (r.quantity || 1), 0),
              Status: request.statuses[0] || '-',
            }));
            const worksheet = XLSX.utils.json_to_sheet([]);

            // Add title and exported date as headers
            XLSX.utils.sheet_add_aoa(worksheet, [
              [`Report Title: My Repair Requests`],
              [`Exported Date: ${new Date().toLocaleString()}`],
            ], { origin: 'A1' });

            // Add table data below the headers
            XLSX.utils.sheet_add_json(worksheet, exportedData, { origin: 'A3', skipHeader: false });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'MyRepairRequests');
            XLSX.writeFile(workbook, `MyRepairRequests_${new Date().toISOString()}.xlsx`);
          }}
          className="mb-4 px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors duration-150"
        >
          Export Report
        </button>
        <Toggle
          label="Filtered View"
          isChecked={isFilteredView}
          onChange={() => setIsFilteredView(!isFilteredView)}
        />
      </div>
      <div className="mt-8">
        <Table
          columns={columns}
          data={repairRequestsToDisplay}
          keyExtractor={keyExtractor}
          isLoading={isLoading}
          emptyMessage="You have no repair requests."
        />
      </div>
    </div>
  );
};

export default MyRepairRequests;
