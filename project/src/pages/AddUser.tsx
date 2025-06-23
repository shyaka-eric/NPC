import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

const rankOptions = [
  { value: '', label: 'Select Rank' },
  { value: 'PC', label: 'PC' },
  { value: 'CPL', label: 'CPL' },
  { value: 'SGT', label: 'SGT' },
  { value: 'S/SGT', label: 'S/SGT' },
  { value: 'C/SGT', label: 'C/SGT' },
  { value: 'OC', label: 'OC' },
  { value: 'AIP', label: 'AIP' },
  { value: 'IP', label: 'IP' },
  { value: 'CIP', label: 'CIP' },
  { value: 'SP', label: 'SP' },
  { value: 'SSP', label: 'SSP' },
  { value: 'CSP', label: 'CSP' },
  { value: 'ACP', label: 'ACP' },
  { value: 'CP', label: 'CP' },
  { value: 'DCG', label: 'DCG' },
  { value: 'CG', label: 'CG' },
];

const roleOptions = [
  { value: '', label: 'Select Role' },
  { value: 'unit-leader', label: 'Unit Leader' },
  { value: 'admin', label: 'Admin' },
  { value: 'logistics-officer', label: 'Logistics Officer' },
  { value: 'system-admin', label: 'System Admin' },
];

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const addUser = useAuthStore(state => state.addUser);
  const [form, setForm] = useState({
    rank: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    role: '',
    unit: '',
    phone_number: '',
    username: '',
    email: '',
    password: '',
    profile_image_file: null as File | null, // add file for upload
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<any>({});

  // Validation function for user input
  const validateUserInput = (user: any) => {
    const errors: any = {};
    // First Name: only letters, spaces, hyphens
    if (!/^[A-Za-z\s\-]+$/.test(user.first_name?.trim() || "")) {
      errors.first_name = "First name should only contain letters, spaces, or hyphens.";
    }
    // Last Name: only letters, spaces, hyphens
    if (!/^[A-Za-z\s\-]+$/.test(user.last_name?.trim() || "")) {
      errors.last_name = "Last name should only contain letters, spaces, or hyphens.";
    }
    // Email: basic email pattern
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email?.trim() || "")) {
      errors.email = "Invalid email address.";
    }
    // Phone: only digits, optionally starts with +
    if (!/^(\+?\d{7,15})$/.test(user.phone_number?.trim() || "")) {
      errors.phone_number = "Phone number should contain only digits and may start with +.";
    }
    // Unit: only letters, numbers, spaces, hyphens
    if (!/^[A-Za-z0-9\s\-]+$/.test(user.unit?.trim() || "")) {
      errors.unit = "Unit should only contain letters, numbers, spaces, or hyphens.";
    }
    // Username: only letters, numbers, underscores, hyphens
    if (!/^[A-Za-z0-9_\-]+$/.test(user.username?.trim() || "")) {
      errors.username = "Username should only contain letters, numbers, underscores, or hyphens.";
    }
    // Password: at least 6 chars
    if ((user.password || "").length < 6) {
      errors.password = "Password should be at least 6 characters long.";
    }
    // Role: must be one of allowed roles
    const allowedRoles = ["unit-leader", "admin", "logistics-officer", "system-admin"];
    if (!allowedRoles.includes(user.role)) {
      errors.role = "Invalid role selected.";
    }
    // Rank: must be one of allowed ranks (if not empty)
    const allowedRanks = [
      '', 'PC', 'CPL', 'SGT', 'S/SGT', 'C/SGT', 'OC', 'AIP', 'IP', 'CIP', 'SP', 'SSP', 'CSP', 'ACP', 'CP', 'DCG', 'CG'
    ];
    if (user.rank && !allowedRanks.includes(user.rank)) {
      errors.rank = "Invalid rank selected.";
    }
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(prev => ({ ...prev, profile_image_file: file }));
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateUserInput(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the errors in the form.');
      return;
    }
    setIsLoading(true);
    setFormErrors({});
    try {
      let payload;
      // Always send is_active as true for both FormData and JSON
      if (form.profile_image_file) {
        payload = new FormData();
        payload.append('rank', form.rank);
        payload.append('username', form.username);
        payload.append('first_name', form.first_name);
        payload.append('last_name', form.last_name);
        payload.append('birth_date', form.birth_date);
        payload.append('role', form.role);
        payload.append('unit', form.unit);
        payload.append('phone_number', form.phone_number);
        payload.append('email', form.email);
        payload.append('password', form.password);
        payload.append('profile_image', form.profile_image_file);
        payload.append('is_active', 'true');
      } else {
        payload = {
          rank: form.rank,
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          birth_date: form.birth_date,
          role: form.role,
          unit: form.unit,
          phone_number: form.phone_number,
          email: form.email,
          password: form.password,
          is_active: true,
        } as any;
      }
      // Call addUser with only the payload (store now handles FormData or JSON)
      await addUser(payload);
      toast.success('User added successfully');
      navigate('/users');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Add User"
        description="Create a new user account."
      />
      <form onSubmit={handleSubmit} className="space-y-6 mt-8" encType="multipart/form-data">
        <Select label="Rank" name="rank" value={form.rank} onChange={handleChange} options={rankOptions} required error={formErrors.rank} />
        <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required error={formErrors.first_name} />
        <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required error={formErrors.last_name} />
        <Input label="Birth Date" name="birth_date" type="date" value={form.birth_date} onChange={handleChange} required />
        <Select label="Role" name="role" value={form.role} onChange={handleChange} options={roleOptions} required error={formErrors.role} />
        <Input label="Unit" name="unit" value={form.unit} onChange={handleChange} required error={formErrors.unit} />
        <Input label="Phone" name="phone_number" value={form.phone_number} onChange={handleChange} required error={formErrors.phone_number} />
        <Input label="Username" name="username" value={form.username} onChange={handleChange} required error={formErrors.username} />
        <Input label="Email" name="email" value={form.email} onChange={handleChange} required type="email" error={formErrors.email} />
        <Input label="Password" name="password" value={form.password} onChange={handleChange} required type="password" error={formErrors.password} />
        <Input label="Profile Image" name="profile_image" type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && (
          <div className="flex justify-center mb-2">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-full object-cover" />
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/users')}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Add User</Button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;