import React, { useState, useEffect } from 'react';
import { Package, User, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const LoginForm: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noUsers, setNoUsers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there are any users in the backend
    api.get('has_users/')
      .then(res => {
        if (res.data && res.data.has_users === false) {
          setNoUsers(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted', email, password);
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-slate-200">
        <div className="text-center">
          <div className="flex justify-center">
            <Package className="h-12 w-12 text-blue-800" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">NPC Logistics</h2>
          <p className="mt-2 text-sm text-slate-600">Sign in to access the logistics system</p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {noUsers && (
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate('/register')}
            className="mb-4"
          >
            Register System Admin
          </Button>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Email address"
              icon={<User className="h-5 w-5 text-slate-400" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              label="Password"
              icon={<Lock className="h-5 w-5 text-slate-400" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              fullWidth
              disabled={noUsers}
            >
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;