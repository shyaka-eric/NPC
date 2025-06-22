import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { toast } from 'sonner';
import { formatDate } from '../utils/formatters';
import Table from '../components/ui/Table';
import { parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import * as XLSX from 'xlsx';
import Toggle from '../components/ui/Toggle';

const MyRequests: React.FC = () => {
  const { requests, fetchRequests } = useRequestsStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [combinedRequests, setCombinedRequests] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const [isFilteredView, setIsFilteredView] = useState(true);

  const rangeType = searchParams.get('rangeType') || 'daily';
  const customStart = searchParams.get('customStart') || '';
  const customEnd = searchParams.get('customEnd') || '';

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        await fetchRequests();
        // Only filter 'new' requests made by the logged-in user
        const filteredRequests = filterRequestsByRange(requests.filter((request) => request.type === 'new' && request.requested_by === user?.id));
        setCombinedRequests(filteredRequests);
      } catch (error) {
        toast.error('Failed to load requests');
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, [fetchRequests, requests, rangeType, customStart, customEnd, user?.id]);

  const getRange = () => {
    const today = new Date();
    switch (rangeType) {
      case 'daily':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'weekly':
        // Adjust weekly range to start from Monday and include all days up to Sunday
        return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
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

  // Corrected debug logs to reference range returned by getRange
  const { start, end } = getRange();

  // Ensure filtering logic includes all items within the weekly range
  const filterRequestsByRange = (requests: any[]) => {
    const { start, end } = getRange();

    return requests.filter((request) => {
      const dateToCheck = request.requestedAt || request.requested_at;
      if (!dateToCheck) {
        console.warn('Request with undefined date field:', request);
        return false;
      }
      const requestedDate = new Date(dateToCheck);
      return requestedDate >= start && requestedDate <= end;
    });
  };

  // Add debug logs to inspect combinedRequests state
  console.log('Combined requests:', combinedRequests);

  // Add debug logs to inspect data passed to Table component
  console.log('Table data:', combinedRequests);

  // Add debug logs to inspect each item passed to Table
  combinedRequests.forEach((item, index) => console.log(`Item ${index}:`, item));

  // Fix duplication issue by ensuring requestsToDisplay is derived directly from the toggle state
  const requestsToDisplay = isFilteredView
    ? filterRequestsByRange(requests.filter(request => request.type === 'new' && request.requested_by === user?.id))
    : requests.filter(request => request.type === 'new' && request.requested_by === user?.id);

  // Ensure `Requested At` column explicitly extracts and displays only the date
  const columns = [
    { header: 'Requested At', accessor: (item: any) => item.requestedAt, render: (date: string) => date.split('T')[0] },
    { header: 'Item Name', accessor: (item: any) => item.itemName || item.item_name, render: (itemName: string) => itemName },
    { header: 'Category', accessor: (item: any) => item.category, render: (category: string) => category },
    { header: 'Quantity', accessor: (item: any) => item.quantity, render: (quantity: number) => quantity.toString() },
    { header: 'Status', accessor: (item: any) => item.status, render: (status: string) => <StatusBadge status={status} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
      <PageHeader
        title="My Requests"
        description="View and manage your item requests."
      />

      <div className="mt-4 flex justify-between items-center">
        <Button
          onClick={() => {
            const exportedData = requestsToDisplay.map(request => ({
              RequestedAt: request.requestedAt,
              ItemName: request.itemName,
              Quantity: request.quantity,
              Status: request.status,
            }));
            const worksheet = XLSX.utils.json_to_sheet([]);

            // Add title and exported date as headers
            XLSX.utils.sheet_add_aoa(worksheet, [
              [`Report Title: My Requests`],
              [`Exported Date: ${new Date().toLocaleString()}`],
            ], { origin: 'A1' });

            // Add table data below the headers
            XLSX.utils.sheet_add_json(worksheet, exportedData, { origin: 'A3', skipHeader: false });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'MyRequests');
            XLSX.writeFile(workbook, `MyRequests_${new Date().toISOString()}.xlsx`);
          }}
          className="mb-4"
        >
          Export Report
        </Button>
        <Toggle
          label="Filtered View"
          isChecked={isFilteredView}
          onChange={() => setIsFilteredView(!isFilteredView)}
        />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse flex space-x-2 items-center">
              <div className="h-4 w-4 bg-slate-300 rounded-full"></div>
              <div className="h-4 w-20 bg-slate-300 rounded"></div>
              <span className="text-sm text-slate-500">Loading...</span>
            </div>
          </div>
        ) : requestsToDisplay.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            No requests found for the selected range.
          </div>
        ) : (
          <Table
            data={requestsToDisplay}
            columns={columns}
            keyExtractor={(item) => `${item.id}-${item.itemName}`}
          />
        )}
      </div>
    </div>
  );
};

export default MyRequests;