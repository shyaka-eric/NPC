import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Profile: React.FC = () => {
  const { user, users, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    phoneNumber: user?.phoneNumber || '',
    profileImage: user?.profileImage || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(formData.profileImage);

  if (!user || !isAuthenticated) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, profileImage: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const isChanged =
    formData.name !== user.name ||
    formData.department !== (user.department || '') ||
    formData.phoneNumber !== (user.phoneNumber || '') ||
    formData.profileImage !== (user.profileImage || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Update user in the store (mock update)
      const updatedUser = { ...user, ...formData, updatedAt: new Date() };
      // Find and update in users array
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = updatedUser;
        useAuthStore.setState({ user: updatedUser, users: [...users] });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="My Profile" description="View and update your profile information" />
      <form onSubmit={handleSave} className="space-y-6 bg-white rounded shadow p-6 mt-6">
        <div className="flex flex-col items-center mb-4">
          <label htmlFor="profileImage" className="cursor-pointer group">
            <div className="h-20 w-20 rounded-full bg-blue-800 flex items-center justify-center text-white text-3xl mb-2 overflow-hidden">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <input
              id="profileImage"
              name="profileImage"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <span className="block text-xs text-blue-700 group-hover:underline">Change Photo</span>
          </label>
        </div>
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          fullWidth
        />
        <Input
          label="Email"
          name="email"
          value={user.email}
          readOnly
          fullWidth
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <div className="w-full px-3 py-2 bg-slate-100 rounded text-slate-700 cursor-not-allowed">
            {user.role.replace('-', ' ')}
          </div>
        </div>
        <Input
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          fullWidth
        />
        <Input
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
        />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" isLoading={isSaving} disabled={isSaving || !isChanged}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile; 