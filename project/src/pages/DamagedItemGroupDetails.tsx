import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { format } from 'date-fns';

interface DamagedItemDetail {
  id: number;
  item_name?: string;
  item_category?: string;
  marked_at?: string;
  marked_by_name?: string;
  issued_item_serial_number?: string;
  damage_description?: string;
}

const DamagedItemGroupDetails: React.FC = () => {
  const { itemName, itemCategory } = useParams<{ itemName: string; itemCategory: string }>();
  const [items, setItems] = useState<DamagedItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await axios.get(`${API_URL}/api/damaged-items/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const filtered = response.data.filter((item: DamagedItemDetail) =>
          item.item_name === decodeURIComponent(itemName || '') &&
          item.item_category === decodeURIComponent(itemCategory || '')
        );
        setItems(filtered);
        setError(null);
      } catch (err) {
        setError('Failed to fetch damaged item details');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [itemName, itemCategory]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!items.length) return <div className="p-8">No damaged items found for this group.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        <button
          className="mb-4 inline-flex items-center gap-1 px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white font-medium shadow-sm transition-colors duration-150 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          onClick={() => navigate('/damaged-items')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold mb-4">Damaged Items: {items[0].item_name} ({items[0].item_category})</h1>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marked By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Damage Description</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.issued_item_serial_number || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.marked_at ? format(new Date(item.marked_at), 'MMM dd, yyyy') : 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.marked_by_name || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.damage_description || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DamagedItemGroupDetails;
