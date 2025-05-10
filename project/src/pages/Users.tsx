import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

const Users: React.FC = () => {
  const { users, fetchUsers, deleteUser, toggleUserActive } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (!users || users.length === 0) {
    return <div className="p-8 text-center text-slate-500">No users found or failed to load users.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-4 py-2 whitespace-nowrap">{user.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                <td className="px-4 py-2 whitespace-nowrap capitalize">{user.role.replace('-', ' ')}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.department}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.phone_number}</td>
                <td className="px-4 py-2 whitespace-nowrap">{user.is_active ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/users/${user.id}/edit`)}>
                    Edit
                  </Button>
                  <Button size="sm" variant={user.is_active ? 'danger' : 'success'} onClick={async () => {
                    await toggleUserActive(user.id, !user.is_active);
                  }}>
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this user?')) {
                      await deleteUser(user.id);
                    }
                  }}>
                    Delete
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