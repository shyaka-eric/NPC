import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, startOfDay, endOfWeek, startOfMonth, endOfMonth, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useSearchParams } from 'react-router-dom';

interface DamagedItem {
    id: number;
    issued_item: {
        id: number;
        item: {
            name: string;
            serial_number: string;
        };
        issued_to: {
            name: string;
            email: string;
        };
        item_category?: string;
        item_name?: string;
        picture?: string;
    };
    issued_item_serial_number?: string; // <-- Add this field for API compatibility
    damage_description: string;
    reported_date: string;
    status: 'pending' | 'repaired' | 'unrepairable';
    repair_notes?: string;
    marked_at?: string; // Add marked_at to match backend
    item_category?: string; // <-- Add these fields to match backend response
    item_name?: string;
    marked_by_name?: string; // Add this field to match backend response
}

const DamagedItems: React.FC = () => {
    const [damagedItems, setDamagedItems] = useState<DamagedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuthStore();
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
          return { start: startOfDay(today), end: endOfWeek(today) };
        case 'monthly':
          return { start: startOfDay(today), end: endOfMonth(today) };
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

    // Pagination state (must be at top level, not inside render)
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Range filter toggle state
    const [filteredView, setFilteredView] = useState(true);

    // Filter damaged items based on the date range (toggle logic)
    const filteredDamagedItems = filteredView
      ? damagedItems.filter(item => {
          const damagedDate = item.reported_date || item.marked_at;
          return inRange(damagedDate);
        })
      : damagedItems;

    const totalPages = Math.ceil(filteredDamagedItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredDamagedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        fetchDamagedItems();
    }, [rangeType, customStart, customEnd]); // Added range dependencies

    const fetchDamagedItems = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            
            const response = await axios.get(`${API_URL}/damaged-items/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setDamagedItems(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch damaged items');
            console.error('Error fetching damaged items:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case 'repaired':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'unrepairable':
                return <XCircle className="h-5 w-5 text-red-500" />;
            default:
                return null;
        }
    };

    // Group damaged items by item_name and item_category
    const groupedDamagedItems: { [key: string]: DamagedItem[] } = {};
    damagedItems.forEach((item) => {
      const key = `${item.item_name || 'Unknown'}|${item.item_category || 'Unknown'}`;
      if (!groupedDamagedItems[key]) {
        groupedDamagedItems[key] = [];
      }
      groupedDamagedItems[key].push(item);
    });

    const handleExportExcel = () => {
      const exportDate = format(new Date(), 'yyyy-MM-dd');
      const wsData = [
        ['Damaged Items Report'],
        [`Exported: ${exportDate}`],
        ['Reported Date', 'Category', 'Item Name', 'Serial Number'],
        ...filteredDamagedItems.map(item => {
          const dateStr = item.reported_date || item.marked_at;
          let formattedDate = '-';
          if (dateStr) {
            try {
              formattedDate = format(new Date(dateStr), 'yyyy-MM-dd');
            } catch {
              formattedDate = dateStr;
            }
          }
          return [
            formattedDate,
            item.item_category || item.issued_item?.item_category || '-',
            item.item_name || item.issued_item?.item_name || item.issued_item?.item?.name || '-',
            item.issued_item_serial_number || '-'
          ];
        })
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      // Merge title and export date rows across all columns
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Damaged Items');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, 'damaged_items_report.xlsx');
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">Please log in to view damaged items</div>
            </div>
        );
    }

    if (loading) {
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
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Damaged Items</h1>
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleExportExcel}
                        className="bg-blue-500 text-white rounded px-4 py-2"
                    >
                        Export Report
                    </button>
                    <div className="flex items-center gap-2 ml-auto">
                        <span>Filtered View</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filteredView}
                                onChange={e => setFilteredView(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:bg-blue-600 transition-all duration-200"></div>
                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5"></div>
                        </label>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedItems.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.item_category || item.issued_item?.item_category || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.item_name || item.issued_item?.item_name || item.issued_item?.item?.name || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.issued_item_serial_number || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.marked_at ? format(new Date(item.marked_at), 'MMM dd, yyyy') : 'Unknown'}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
        </div>
    );
};

export default DamagedItems;