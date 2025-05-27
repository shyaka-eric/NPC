import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';

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
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Marked Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Marked By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(groupedDamagedItems).map(([key, items]) => {
                            const firstItem = items[0];
                            return (
                              <tr key={key}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {firstItem.item_category ? firstItem.item_category : 'Unknown'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {firstItem.item_name ? firstItem.item_name : 'Unknown'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {firstItem.marked_at ? format(new Date(firstItem.marked_at), 'MMM dd, yyyy') : 'Unknown'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {firstItem.marked_by_name ? firstItem.marked_by_name : 'Unknown'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Link
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold shadow-sm transition-colors duration-150 border border-blue-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                    to={`/damaged-items/group/${encodeURIComponent(firstItem.item_name || 'Unknown')}/${encodeURIComponent(firstItem.item_category || 'Unknown')}`}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    View Details
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DamagedItems;