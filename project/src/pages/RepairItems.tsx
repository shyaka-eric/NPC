import React, { useEffect, useState } from 'react';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';
import { fetchRepairRequests } from '../services/api';
import axios from 'axios';
import { API_URL } from '../config';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import Toggle from '../components/ui/Toggle';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const RepairItems: React.FC = () => {
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [repairRequests, setRepairRequests] = useState<any[]>([]);
  const [photoModal, setPhotoModal] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });
  const [searchParams] = useSearchParams();
  const [isFilteredView, setIsFilteredView] = useState(true);

  const rangeType = searchParams.get('rangeType') || 'daily';
  const customStart = searchParams.get('customStart') || '';
  const customEnd = searchParams.get('customEnd') || '';

  const today = new Date();

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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const repairRequestsData: any[] = await fetchRepairRequests();
      const filteredRepairRequests = isFilteredView
        ? repairRequestsData.filter((req: any) => {
            const dateToCheck = req.requestedAt || req.created_at;
            if (!dateToCheck) return false;
            const requestDate = new Date(dateToCheck);
            return requestDate >= start && requestDate <= end;
          })
        : repairRequestsData; // Show all requests when toggle is off
      setRepairRequests(filteredRepairRequests);
      await fetchItems();
      setIsLoading(false);
    };
    load();
  }, [rangeType, customStart, customEnd, isFilteredView]);

  const refreshRepairRequests = async () => {
    setIsLoading(true);
    const repairRequestsData: any[] = await fetchRepairRequests();
    const filteredRepairRequests = repairRequestsData.filter((req: any) => {
      const dateToCheck = req.requestedAt || req.created_at;
      if (!dateToCheck) return false;
      const requestDate = new Date(dateToCheck);
      return requestDate >= start && requestDate <= end;
    });
    setRepairRequests(filteredRepairRequests);
    setIsLoading(false);
  };

  const handleApprove = async (request: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }
      // Call the correct endpoint for repair-in-process
      await axios.patch(`${API_URL}/repair-requests/${request.id}/mark_repair_in_process/`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Request moved to repair in process.');
      setRepairRequests(repairRequests.map(r =>
        r.id === request.id ? { ...r, status: 'repair-in-process' } : r
      ));
      setTimeout(refreshRepairRequests, 500);
    } catch (error) {
      toast.error('Failed to move request to repair in process.');
      await refreshRepairRequests();
    }
  };

  const handleMarkAsDamaged = async (request: any) => {
    console.log("Attempting to mark request as damaged:", request);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    // Support both object and id for issued_item
    const issuedItemId = typeof request.issued_item === 'object' && request.issued_item !== null
      ? request.issued_item.id
      : request.issued_item;

    if (!issuedItemId) {
      console.error('Repair request object:', request); // Debug log
      toast.error('Issued item details are missing for this repair request. Please ensure the item has been issued before marking as damaged.');
      return;
    }

    try {
      const damagedItemData = {
        issued_item: issuedItemId,
        repair_request: request.id, // Add the repair request ID
        damage_description: request.description,
      };

      await axios.post(`${API_URL}/api/damaged-items/`, damagedItemData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Item marked as damaged and added to damaged items list.');
      await refreshRepairRequests();
    } catch (error) {
      console.error('Error marking item as damaged:', error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error('This item has already been marked as damaged.');
        await refreshRepairRequests();
      } else if (axios.isAxiosError(error) && error.response?.status === 500) {
        toast.error('Server error occurred. Please try again later.');
      } else {
        toast.error('Failed to mark item as damaged.');
      }
    }
  };

  const getPictureUrl = (r: any) => {
    if (!r.picture) return null;
    if (r.picture.startsWith('http')) return r.picture;
    return `http://localhost:8000${r.picture.startsWith('/media/') ? r.picture : '/media/' + r.picture}`;
  };

  // Helper to get the real status for a repair item
  const getRealStatus = (r: any) => {
    // Only use valid backend statuses
    if (!r.status || r.status === 'pending') return 'pending';
    if (r.status === 'damaged') return 'damaged';
    if (r.status === 'repair-in-process') return 'repair-in-process';
    if (r.status === 'repaired') return 'repaired';
    // Fallback for any unknown status (should not happen)
    return 'pending';
  };

  // Sort repairRequests by latest created_at first
  const sortedRepairRequests = [...repairRequests].sort((a, b) => {
    const getDate = (r: any) => new Date(r.created_at || 0).getTime();
    return getDate(b) - getDate(a);
  });

  // Pagination logic (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(sortedRepairRequests.length / ITEMS_PER_PAGE);
  const paginatedRepairRequests = sortedRepairRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { header: 'Request Date', accessor: (r: any) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-' },
    { header: 'Category', accessor: (r: any) => r.item_category || r.issued_item?.item_category || r.category || (items.find((i: any) => i.id === r.item)?.category || '-') },
    { header: 'Item', accessor: (r: any) => r.item_name || r.issued_item?.item_name || (items.find((i: any) => i.id === r.item)?.name || '-') },
    { header: 'Requested By', accessor: (r: any) => r.requested_by_name || '-' },
    { header: 'Picture', accessor: (r: any) => {
      const url = getPictureUrl(r);
      return url ? (
        <Button size="sm" variant="secondary" onClick={() => setPhotoModal({ open: true, url })}>View Photo</Button>
      ) : '-';
    } },
    { header: 'Reason', accessor: (r: any) => r.reason || r.description || '-' },
    { header: 'Status', accessor: (r: any) => {
      const status = getRealStatus(r);
      if (status === 'pending') return 'Pending';
      if (status === 'damaged') return 'Damaged';
      if (status === 'repair-in-process') return 'Repair in process';
      if (status === 'repaired') return 'Repaired';
      return status;
    } },
    {
      header: 'Actions',
      accessor: (r: any) => {
        const realStatus = getRealStatus(r);
        if (realStatus === 'damaged') {
          return <span className="text-red-600 font-semibold">Marked Damaged</span>;
        }
        if (realStatus === 'repair-in-process') {
          return <span className="text-yellow-600 font-semibold">Repair in process</span>;
        }
        if (realStatus === 'repaired') {
          return <span className="text-green-600 font-semibold">Repaired</span>;
        }
        // Only allow actions if pending
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="success" onClick={() => handleApprove(r)} disabled={realStatus !== 'pending'}>Repair</Button>
            <Button size="sm" variant="danger" onClick={() => handleMarkAsDamaged(r)} disabled={realStatus !== 'pending'}>Damaged</Button>
          </div>
        );
      }
    }
  ];

  const exportToExcel = () => {
    const worksheetData = repairRequests.map((r) => ({
      'Request Date': r.created_at ? new Date(r.created_at).toLocaleDateString() : '-',
      'Category': r.item_category || r.issued_item?.item_category || r.category || (items.find((i) => i.id === r.item)?.category || '-'),
      'Item': r.item_name || r.issued_item?.item_name || (items.find((i) => i.id === r.item)?.name || '-'),
      'Requested By': r.requested_by_name || '-',
      'Reason': r.reason || r.description || '-',
      'Status': getRealStatus(r),
    }));

    const worksheet = XLSX.utils.json_to_sheet([]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Repair Items');

    const exportedDate = new Date().toLocaleDateString();
    const title = `Repair Items Report (${exportedDate})`;
    XLSX.utils.sheet_add_aoa(worksheet, [[title]], { origin: 'A1' });
    XLSX.utils.sheet_add_aoa(worksheet, [['Exported Date:', exportedDate]], { origin: 'A2' });
    XLSX.utils.sheet_add_json(worksheet, worksheetData, { origin: 'A4' });

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `Repair_Items_Report_${exportedDate}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Repair Items" description="View all repair item requests, including serial number and picture." />
      <div className="mt-4 flex justify-between items-center">
        <Button
          size="sm"
          variant="primary"
          onClick={exportToExcel}
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
          data={paginatedRepairRequests}
          keyExtractor={r => r.id}
          isLoading={isLoading}
          emptyMessage="No repair requests found."
        />
      </div>
      <SimpleModal open={photoModal.open} onClose={() => setPhotoModal({ open: false, url: null })} title="Photo">
        {photoModal.url && <img src={photoModal.url} alt="Attachment" style={{ maxWidth: 500, maxHeight: 500 }} />}
      </SimpleModal>
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

export default RepairItems;
