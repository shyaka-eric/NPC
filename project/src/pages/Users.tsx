import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const Users: React.FC = () => {
  const { users, fetchUsers, toggleUserActive } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // Filter users by date range
  const filteredUsers = users.filter(user => {
    const created = user.createdAt;
    if (!created) return false;
    const date = new Date(created);
    return date >= start && date <= end;
  });

  if (!users || users.length === 0) {
    return <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center">No users found or failed to load users.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
      <PageHeader
        title="Users Management"
        description="View, add, edit, and manage all users in the system."
        actions={
          <Button variant="primary" onClick={() => navigate('/users/add')}>
            Add User
          </Button>
        }
      />
      <div className="overflow-x-auto mt-8">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Unit</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-2 whitespace-nowrap">{user.first_name || user.username || user.email}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                <td className="px-4 py-2 whitespace-nowrap capitalize">{user.role.replace('-', ' ')}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.unit}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.phoneNumber}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/users/${user.id}/edit`)}>
                    Edit
                  </Button>
                  <Button size="sm" variant={user.isActive ? 'warning' : 'success'} onClick={async () => {
                    await toggleUserActive(user.id, !user.isActive);
                  }}>
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;