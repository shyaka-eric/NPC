import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Phone, Building } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phoneNumber: ''
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
        name: formData.name,
        email: formData.email,
        username: formData.email,
        password: formData.password,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        role: 'system-admin' // First user is always system admin
      });
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            <Input
              id="name"
              name="name"
              type="text"
              required
              label="Full Name"
              icon={<User className="h-5 w-5 text-slate-400" />}
              value={formData.name}
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

            <Input
              id="department"
              name="department"
              type="text"
              required
              label="Department"
              icon={<Building className="h-5 w-5 text-slate-400" />}
              value={formData.department}
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