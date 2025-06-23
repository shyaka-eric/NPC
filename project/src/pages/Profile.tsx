import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { updateUserProfile } from '../services/api';

const Profile: React.FC = () => {
  const { user, users, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    phoneNumber: user?.phoneNumber || '',
    profileImage: user?.profileImage || '',
    password: '',
    profileImageFile: null as File | null, // store file for upload
  });
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(
    user?.profileImage
      ? user.profileImage.startsWith('http')
        ? user.profileImage
        : user.profileImage.startsWith('/media/')
          ? `http://localhost:8000${user.profileImage}`
          : user.profileImage
      : ''
  );
  const [success, setSuccess] = useState(false); // Add success state

  if (!user || !isAuthenticated) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccess(false); // Reset success on change
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, profileImageFile: file }));
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, profileImage: base64 }));
      setImagePreview(base64);
      setSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const isChanged =
    formData.phoneNumber !== (user.phoneNumber || '') ||
    formData.profileImage !== (user.profileImage || '') ||
    formData.password.length > 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let updatedUser;
      // Always send is_active: true on update to prevent deactivation
      if (formData.profileImageFile) {
        // Use FormData for file upload
        const form = new FormData();
        form.append('username', user.username);
        form.append('email', user.email);
        form.append('role', user.role);
        form.append('phone_number', formData.phoneNumber);
        form.append('first_name', user.first_name || '');
        form.append('last_name', user.last_name || '');
        form.append('unit', user.unit || '');
        form.append('rank', user.rank || '');
        form.append('birth_date', user.birth_date || '');
        form.append('profile_image', formData.profileImageFile);
        form.append('is_active', 'true');
        if (formData.password) form.append('password', formData.password);
        updatedUser = await updateUserProfile(user.id, form, true); // pass true for multipart
      } else {
        // Fallback to JSON if no new image
        const payload: any = {
          username: user.username,
          email: user.email,
          role: user.role,
          phone_number: formData.phoneNumber,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          unit: user.unit || '',
          rank: user.rank || '',
          birth_date: user.birth_date || '',
          profile_image: formData.profileImage,
          is_active: true,
        };
        if (formData.password) payload.password = formData.password;
        updatedUser = await updateUserProfile(user.id, payload);
      }
      // Update user in the store
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = updatedUser;
        useAuthStore.setState({ user: { ...updatedUser }, users: [...users] });
        setSuccess(true);
        setFormData({
          phoneNumber: updatedUser.phone_number || '',
          profileImage: updatedUser.profile_image || '',
          password: '',
          profileImageFile: null,
        });
        // Set image preview to backend URL if needed
        let imageUrl = '';
        if (updatedUser.profile_image) {
          // If it's already a full URL, use as is
          if (updatedUser.profile_image.startsWith('http')) {
            imageUrl = updatedUser.profile_image;
          } else if (updatedUser.profile_image.startsWith('/media/')) {
            // If it starts with /media/, prepend backend host
            imageUrl = `http://localhost:8000${updatedUser.profile_image}`;
          } else if (updatedUser.profile_image.includes('/')) {
            // If it contains a slash but not /media/, treat as relative to backend
            imageUrl = `http://localhost:8000/${updatedUser.profile_image.replace(/^\/+/, '')}`;
          } else {
            // Otherwise, treat as filename in media root
            imageUrl = `http://localhost:8000/media/${updatedUser.profile_image}`;
          }
        }
        setImagePreview(imageUrl);
      }
    } catch (error) {
      setSuccess(false);
      alert('Failed to update profile.');
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
                (user.first_name ? user.first_name.charAt(0) : user.username.charAt(0))
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
        {success && (
          <div className="text-green-600 text-sm text-center">Profile updated successfully!</div>
        )}
        <Input
          label="Full Name"
          name="full_name"
          value={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name || user.username || user.email}
          readOnly
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
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          placeholder="Enter new password (leave blank to keep current)"
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