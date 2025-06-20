import React, { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import npcLogo from '../images/npclogo.jpeg';

const ORG_NAME_KEY = 'orgName';
const ORG_LOGO_KEY = 'orgLogo';

const LoginForm: React.FC = () => {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noUsers, setNoUsers] = useState(false);
  const [orgName, setOrgName] = useState(localStorage.getItem(ORG_NAME_KEY) || 'NPC Logistics');
  const [orgLogo, setOrgLogo] = useState(localStorage.getItem(ORG_LOGO_KEY));
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

  useEffect(() => {
    const handleStorage = () => {
      setOrgName(localStorage.getItem(ORG_NAME_KEY) || 'NPC Logistics');
      setOrgLogo(localStorage.getItem(ORG_LOGO_KEY));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError(useAuthStore.getState().error || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow-md border border-slate-200 bg-white">
        <div className="text-center">
          <div className="flex justify-center">
            {orgLogo ? (
              <img
                src={orgLogo}
                alt="Organization Logo"
                className="h-16 w-16 object-contain rounded-full shadow"
                style={{ background: 'white' }}
              />
            ) : (
              <img
                src={npcLogo}
                alt="NPC Logo"
                className="h-16 w-16 object-contain rounded-full shadow"
                style={{ background: 'white' }}
              />
            )}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-800">{orgName}</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to access the logistics system</p>
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