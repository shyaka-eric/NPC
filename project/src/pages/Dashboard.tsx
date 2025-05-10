import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLogsStore } from '../store/logsStore';
import { PlusCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import DashboardStats from '../components/DashboardStats';
import RecentRequests from '../components/RecentRequests';
import RecentActivityLog from '../components/RecentActivityLog';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { addLog } = useLogsStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Log the dashboard visit
      addLog(
        user.id,
        user.name,
        'Dashboard Access',
        'User accessed the dashboard'
      );
    }
  }, [user, addLog]);

  if (!user) return null;

  // Render dashboard based on user role
  const renderActionButton = () => {
    switch (user.role) {
      case 'unit-leader':
        return (
          <Button
            variant="primary"
            icon={<PlusCircle className="h-4 w-4" />}
            onClick={() => navigate('/new-request')}
          >
            New Request
          </Button>
        );
      case 'admin':
        return (
          <Button
            variant="primary"
            icon={<PlusCircle className="h-4 w-4" />}
            onClick={() => navigate('/admin/requests')}
          >
            View Requests
          </Button>
        );
      case 'logistics-officer':
        return (
          <Button
            variant="primary"
            icon={<PlusCircle className="h-4 w-4" />}
            onClick={() => navigate('/stock-management')}
          >
            Manage Stock
          </Button>
        );
      case 'system-admin':
        return (
          <Button
            variant="primary"
            icon={<PlusCircle className="h-4 w-4" />}
            onClick={() => navigate('/reports')}
          >
            Generate Report
          </Button>
        );
      default:
        return null;
    }
  };

  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    
    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 18) {
      greeting = 'Good afternoon';
    }
    
    return `${greeting}, ${user.name}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader 
        title={getGreeting()} 
        description={`Welcome to your ${user.role.replace('-', ' ')} dashboard`}
        actions={renderActionButton()}
      />
      
      <DashboardStats />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentRequests />
        <RecentActivityLog />
      </div>
    </div>
  );
};

export default Dashboard;