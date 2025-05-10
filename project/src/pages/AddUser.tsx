import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

const roleOptions = [
  { value: 'unit-leader', label: 'Unit Leader' },
  { value: 'admin', label: 'Admin' },
  { value: 'logistics-officer', label: 'Logistics Officer' },
  { value: 'system-admin', label: 'System Admin' },
];

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const addUser = useAuthStore(state => state.addUser);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'unit-leader',
    department: '',
    phone_number: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const userPayload = {
      first_name: form.name,
      last_name: '',
      email: form.email,
      username: form.email,
      role: form.role,
      department: form.department,
      phone_number: form.phone_number,
      password: form.password,
    };
    addUser(userPayload);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/users');
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Add User"
        description="Create a new user account."
      />
      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
        <Input label="Email" name="email" value={form.email} onChange={handleChange} required type="email" />
        <Select label="Role" name="role" value={form.role} onChange={handleChange} options={roleOptions} required />
        <Input label="Password" name="password" value={form.password} onChange={handleChange} required type="password" />
        <Input label="Phone" name="phone_number" value={form.phone_number} onChange={handleChange} required />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/users')}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Add User</Button>
        </div>
      </form>
    </div>
  );
};

export default AddUser; 