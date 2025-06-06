import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Phone, Building } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import Select from './ui/Select';

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
  { value: 'system-admin', label: 'System Admin' },
];

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    rank: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    role: 'system-admin',
    unit: '',
    phoneNumber: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        rank: formData.rank,
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        role: 'system-admin',
        unit: formData.unit,
        phoneNumber: formData.phoneNumber,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-slate-200">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-slate-900">Create System Admin Account</h2>
          <p className="mt-2 text-sm text-slate-600">Set up the initial administrator account</p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select label="Rank" name="rank" value={formData.rank} onChange={handleChange} options={rankOptions} required />

            <Input
              id="first_name"
              name="first_name"
              type="text"
              required
              label="First Name"
              icon={<User className="h-5 w-5 text-slate-400" />}
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
            />

            <Input
              id="last_name"
              name="last_name"
              type="text"
              required
              label="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
            />

            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              required
              label="Birth Date"
              value={formData.birth_date}
              onChange={handleChange}
              fullWidth
            />

            <Select label="Role" name="role" value={formData.role} onChange={handleChange} options={roleOptions} required disabled />

            <Input
              id="unit"
              name="unit"
              type="text"
              required
              label="Unit"
              icon={<Building className="h-5 w-5 text-slate-400" />}
              value={formData.unit}
              onChange={handleChange}
              fullWidth
            />

            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              required
              label="Phone Number"
              icon={<Phone className="h-5 w-5 text-slate-400" />}
              value={formData.phoneNumber}
              onChange={handleChange}
              fullWidth
            />

            <Input
              id="username"
              name="username"
              type="text"
              required
              label="Username"
              icon={<User className="h-5 w-5 text-slate-400" />}
              value={formData.username}
              onChange={handleChange}
              fullWidth
            />

            <Input
              id="email"
              name="email"
              type="email"
              required
              label="Email Address"
              icon={<Mail className="h-5 w-5 text-slate-400" />}
              value={formData.email}
              onChange={handleChange}
              fullWidth
            />

            <Input
              id="password"
              name="password"
              type="password"
              required
              label="Password"
              icon={<Lock className="h-5 w-5 text-slate-400" />}
              value={formData.password}
              onChange={handleChange}
              fullWidth
            />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              label="Confirm Password"
              icon={<Lock className="h-5 w-5 text-slate-400" />}
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
          >
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;