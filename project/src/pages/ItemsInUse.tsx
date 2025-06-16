import React, { useEffect, useState } from 'react';
import { useItemsStore } from '../store/itemsStore';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table'; // Correct import for Table
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import { IssuedItemModel } from '../models/item.model';
import { useSearchParams } from 'react-router-dom';
import SimpleModal from '../components/ui/SimpleModal';
import Input from '../components/ui/Input';
import { requestRepair } from '../services/api';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import Toggle from '../components/ui/Toggle';

const ITEMS_PER_PAGE = 10; // Changed to 10 items per page

// Define TableColumn type locally since it's not exported
interface TableColumn<T> {
  header: React.ReactNode;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

const ItemsInUse: React.FC = () => {
  const { user } = useAuthStore();
  const { issuedItems, fetchIssuedItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IssuedItemModel | null>(null);
  const [reason, setReason] = useState('');
  const [picture, setPicture] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFilteredView, setIsFilteredView] = useState(true);

  const [searchParams] = useSearchParams();

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
    const loadIssuedItems = async () => {
      setIsLoading(true);
      try {
        await fetchIssuedItems();
      } catch (error) {
        toast.error('Failed to load issued items');
      } finally {
        setIsLoading(false);
      }
    };
    loadIssuedItems();
  }, [fetchIssuedItems, rangeType, customStart, customEnd]); // Added range dependencies

  // Filter issued items for the current user and by date range
  const itemsToDisplay = isFilteredView
    ? (issuedItems || []).filter(item => {
        const isAssignedToUser = String(item.assigned_to) === String(user?.id);
        const isInRange = inRange(item.assigned_date);
        return isAssignedToUser && isInRange;
      })
    : issuedItems || [];

  // Remove grouping: show each issued item individually
  const paginatedItems = itemsToDisplay.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(itemsToDisplay.length / ITEMS_PER_PAGE);

  const handleRequestRepair = (item: IssuedItemModel) => {
    setSelectedItem(item);
    setReason('');
    setPicture(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedItem(null);
    setReason('');
    setPicture(null);
  };

  const handleSubmitRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('item', selectedItem.item.toString()); // Use item id for 'item'
      formData.append('issued_item_id', selectedItem.id.toString()); // Add issued_item_id
      formData.append('serial_number', selectedItem.serial_number || '');
      formData.append('category', selectedItem.item_category || '');
      formData.append('reason', reason);
      if (picture) formData.append('picture', picture);
      await requestRepair(formData);
      toast.success('Repair request submitted successfully');
      handleModalClose();
    } catch (error) {
      toast.error('Failed to submit repair request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Table columns for individual issued items
  const columns: TableColumn<IssuedItemModel>[] = [
    {
      header: 'Serial Number',
      accessor: (item) => item.serial_number || '-',
      className: 'font-mono',
    },
    {
      header: 'Item Name',
      accessor: (item) => item.item_name || '-',
    },
    {
      header: 'Category',
      accessor: (item) => item.item_category || '-',
    },
    {
      header: 'Assigned Date',
      accessor: (item) => item.assigned_date ? new Date(item.assigned_date).toLocaleDateString() : '-',
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleRequestRepair(item)}
        >
          Request Repair
        </Button>
      ),
    },
  ];

  // Log the API response for issuedItems
  useEffect(() => {
    if (issuedItems) {
      console.log('API Response:', issuedItems);
    }
  }, [issuedItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Items in Use"
        description="View items currently assigned to you"
      />
      <div className="mt-4 flex justify-between items-center">
        {/* Wrap the toggle and export button in a flex container to align them on the same line */}
        <Button
          onClick={() => {
            const exportedData = itemsToDisplay.map(item => ({
              SerialNumber: item.serial_number,
              ItemName: item.item_name,
              Category: item.item_category,
              AssignedDate: item.assigned_date,
            }));
            const worksheet = XLSX.utils.json_to_sheet([]);

            // Add title and exported date as headers
            XLSX.utils.sheet_add_aoa(worksheet, [
              [`Report Title: Items In Use`],
              [`Exported Date: ${new Date().toLocaleString()}`],
            ], { origin: 'A1' });

            // Add table data below the headers
            XLSX.utils.sheet_add_json(worksheet, exportedData, { origin: 'A3', skipHeader: false });

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Items In Use');
            XLSX.writeFile(workbook, 'ItemsInUseReport.xlsx');
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
        <Table
          columns={columns}
          data={paginatedItems}
          keyExtractor={item => String(item.id)}
          isLoading={isLoading}
          emptyMessage="You don't have any items assigned to you."
        />
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
        <SimpleModal open={showModal} onClose={handleModalClose} title="Request Repair">
          <form onSubmit={handleSubmitRepair} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Serial Number</label>
              <Input value={selectedItem?.serial_number || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Name</label>
              <Input value={selectedItem?.item_name || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <Input value={selectedItem?.item_category || ''} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reason for Repair</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                required
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Picture of Damage</label>
              <div className="relative flex items-center">
                <input
                  id="picture-upload"
                  type="file"
                  accept="image/*"
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                  onChange={e => setPicture(e.target.files?.[0] || null)}
                  required
                  style={{}} // Remove all visible styles
                />
                <div className="w-full border rounded px-3 py-2 pr-32 bg-white flex items-center">
                  <span className="text-gray-500 text-sm truncate max-w-[10rem]">
                    {picture ? picture.name : 'No file selected'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={handleModalClose} className="mr-2">Cancel</Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>Submit</Button>
            </div>
          </form>
        </SimpleModal>
      </div>
    </div>
  );
};

export default ItemsInUse;