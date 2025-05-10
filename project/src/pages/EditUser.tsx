import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import PageHeader from '../components/PageHeader';

const roleOptions = [
  { value: 'unit-leader', label: 'Unit Leader' },
  { value: 'admin', label: 'Admin' },
  { value: 'logistics-officer', label: 'Logistics Officer' },
  { value: 'system-admin', label: 'System Admin' },
];

const EditUser: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    role: '',
    department: '',
    phone_number: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      const response = await api.get(`users/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm(response.data);
    };
    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const payload = { ...form, username: form.email };
    await api.patch(`users/${id}/`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setIsLoading(false);
    navigate('/users');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Edit User" description="Update user account details." />
      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required />
        <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} />
        <Input label="Email" name="email" value={form.email} onChange={handleChange} required type="email" />
        <Select label="Role" name="role" value={form.role} onChange={handleChange} options={roleOptions} required />
        <Input label="Department" name="department" value={form.department || ''} onChange={handleChange} />
        <Input label="Phone" name="phone_number" value={form.phone_number || ''} onChange={handleChange} />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/users')}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditUser; 