import React, { useEffect } from 'react';
import { fetchDeletedItems } from '../services/itemsApi';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/formatters';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import Toggle from '../components/ui/Toggle';
import * as XLSX from 'xlsx';

const DeletedItems: React.FC = () => {
  const [deletedItems, setDeletedItems] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [filteredView, setFilteredView] = React.useState(true);

  useEffect(() => {
    const loadDeletedItems = async () => {
      setIsLoading(true);
      try {
        const data = await fetchDeletedItems();
        setDeletedItems(data.results || data); // handle pagination or plain array
      } catch (e) {
        setDeletedItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeletedItems();
  }, []);

  // Get range parameters from URL
  const searchParams = new URLSearchParams(window.location.search);
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
  const { start, end } = getRange();

  // Filter deleted items by date range if filteredView is ON
  const filteredItems = filteredView
    ? deletedItems.filter(item => {
        const deletedDate = item.deleted_at || item.updated_at || item.last_updated;
        if (!deletedDate) return false;
        const date = new Date(deletedDate);
        return date >= start && date <= end;
      })
    : deletedItems;

  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Expiration Date', accessor: (item: any) => item.expiration_date ? formatDate(item.expiration_date) : '-' },
    { header: 'Last Updated', accessor: (item: any) => item.last_updated ? formatDate(item.last_updated) : '-' },
    { header: 'Reason', accessor: (item: any) => item.deletion_reason || '-' },
  ];

  // Export handler
  const handleExport = () => {
    const exportData = filteredItems.map(item => ({
      Name: item.name,
      Category: item.category,
      Quantity: item.quantity,
      'Expiration Date': item.expiration_date ? formatDate(item.expiration_date) : '-',
      'Last Updated': item.last_updated ? formatDate(item.last_updated) : '-',
      Reason: item.deletion_reason || '-',
    }));
    const worksheet = XLSX.utils.json_to_sheet([]);
    // Add title and exported date as headers
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['Report Title: Deleted Items'],
      [`Exported Date: ${new Date().toLocaleString()}`],
      []
    ], { origin: 'A1' });
    // Add table data below the headers
    XLSX.utils.sheet_add_json(worksheet, exportData, { origin: 'A4', skipHeader: false });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Deleted Items');
    XLSX.writeFile(workbook, 'DeletedItemsReport.xlsx');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Deleted Items" description="Track all deleted stock items." />
      <div className="flex justify-between mb-4">
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          onClick={handleExport}
        >
          Export Report
        </button>
        <Toggle
          label="Filtered View"
          isChecked={filteredView}
          onChange={() => setFilteredView(v => !v)}
        />
      </div>
      <div className="mt-8">
        <Table
          columns={columns}
          data={paginatedItems}
          keyExtractor={item => item.id}
          isLoading={isLoading}
          emptyMessage="No deleted items found."
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      </div>
    </div>
  );
};

export default DeletedItems;
