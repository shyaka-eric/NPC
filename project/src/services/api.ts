import { api } from '../api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchRepairRequests = async () => {
  try {
    const response = await fetch(`${API_URL}/api/repair-requests/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch repair requests');
    return await response.json();
  } catch (error) {
    console.error('Error fetching repair requests:', error);
    throw error;
  }
};

export const fetchNewItemRequests = async () => {
  try {
    const response = await fetch(`${API_URL}/api/requests/?type=new`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch new item requests');
    return await response.json();
  } catch (error) {
    console.error('Error fetching new item requests:', error);
    throw error;
  }
};