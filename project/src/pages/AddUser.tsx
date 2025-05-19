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
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Form data being sent:', form);
      await addUser({
        rank: form.rank,
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
        role: form.role as any, // typecast to satisfy UserRole
        unit: form.unit,
        phone_number: form.phone_number, // use snake_case for backend
        email: form.email,
        password: form.password,
      });
      toast.success('User added successfully');
      navigate('/users');
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Add User"
        description="Create a new user account."
      />
      <form onSubmit={handleSubmit} className="space-y-6 mt-8" encType="multipart/form-data">
        <Select label="Rank" name="rank" value={form.rank} onChange={handleChange} options={rankOptions} required />
        <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required />
        <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required />
        <Input label="Birth Date" name="birth_date" type="date" value={form.birth_date} onChange={handleChange} required />
        <Select label="Role" name="role" value={form.role} onChange={handleChange} options={roleOptions} required />
        <Input label="Unit" name="unit" value={form.unit} onChange={handleChange} required />
        <Input label="Phone" name="phone_number" value={form.phone_number} onChange={handleChange} required />
        <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
        <Input label="Email" name="email" value={form.email} onChange={handleChange} required type="email" />
        <Input label="Password" name="password" value={form.password} onChange={handleChange} required type="password" />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/users')}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Add User</Button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;