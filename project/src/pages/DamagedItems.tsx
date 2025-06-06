import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

    // Pagination state (must be at top level, not inside render)
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const totalPages = Math.ceil(damagedItems.length / ITEMS_PER_PAGE);
    const paginatedItems = damagedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        fetchDamagedItems();
    }, []);

    const fetchDamagedItems = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            
            const response = await axios.get(`${API_URL}/api/damaged-items/`, {
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
      const wsData = [
        ['Reported Date', 'Category', 'Item Name', 'Serial Number', 'Reported By', 'Status', 'Damage Description'],
        ...damagedItems.map(item => [
          format(new Date(item.reported_date), 'yyyy-MM-dd'),
          item.item_category || item.issued_item?.item_category || '-',
          item.item_name || item.issued_item?.item_name || item.issued_item?.item?.name || '-',
          item.issued_item?.item?.serial_number || '-',
          item.issued_item?.issued_to?.name || '-',
          item.status,
          item.damage_description
        ])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
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
                        className="bg-green-500 text-white rounded px-4 py-2"
                    >
                        Export to Excel
                    </button>
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