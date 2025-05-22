import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
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
    // Add more fields as needed
}

const DamagedItemDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [item, setItem] = useState<DamagedItemDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('No authentication token found');
                const response = await axios.get(`${API_URL}/api/damaged-items/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setItem(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch damaged item details');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;
    if (!item) return <div className="p-8">No details found.</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold mb-4">Damaged Item Details</h1>
                <div className="mb-2"><strong>Category:</strong> {item.item_category || 'Unknown'}</div>
                <div className="mb-2"><strong>Item Name:</strong> {item.item_name || 'Unknown'}</div>
                <div className="mb-2"><strong>Serial Number:</strong> {item.issued_item_serial_number || 'Unknown'}</div>
                <div className="mb-2"><strong>Marked By:</strong> {item.marked_by_name || 'Unknown'}</div>
                <div className="mb-2"><strong>Marked Date:</strong> {item.marked_at ? format(new Date(item.marked_at), 'MMM dd, yyyy') : 'Unknown'}</div>
                <div className="mb-2"><strong>Damage Description:</strong> {item.damage_description || 'None'}</div>
            </div>
        </div>
    );
};

export default DamagedItemDetails;
