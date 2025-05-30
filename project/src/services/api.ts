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

export const updateUserProfile = async (
  userId: string,
  data: any,
  isMultipart = false
) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const headers: any = {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  };
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_URL}/api/users/${userId}/`, {
    method: 'PUT',
    headers,
    body: isMultipart ? data : JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return await response.json();
};

export async function requestRepair(formData: FormData) {
  // Assumes the backend expects a POST to /api/repair-requests/ with multipart/form-data
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/repair-requests/`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error('Failed to submit repair request');
  }
  return response.json();
}