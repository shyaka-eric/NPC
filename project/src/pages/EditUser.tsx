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

const EditUser: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    const payload = { ...form, username: form.username };
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
        <Select label="Rank" name="rank" value={form.rank} onChange={handleChange} options={rankOptions} required />
        <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required />
        <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required />
        <Input label="Birth Date" name="birth_date" type="date" value={form.birth_date} onChange={handleChange} required />
        <Select label="Role" name="role" value={form.role} onChange={handleChange} options={roleOptions} required />
        <Input label="Unit" name="unit" value={form.unit} onChange={handleChange} required />
        <Input label="Phone" name="phone_number" value={form.phone_number} onChange={handleChange} required />
        <Input label="Username" name="username" value={form.username} onChange={handleChange} required />
        <Input label="Email" name="email" value={form.email} onChange={handleChange} required type="email" />
        <Input label="Password" name="password" value={form.password} onChange={handleChange} type="password" />
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={() => navigate('/users')}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;