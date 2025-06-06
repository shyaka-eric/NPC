import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { PlusCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';
import DashboardStats from '../components/DashboardStats';
import RecentRequests from '../components/RecentRequests';
import AnalysisCard from '../components/AnalysisCard';
import RecentActivityLog from '../components/RecentActivityLog';
import { useNavigate } from 'react-router-dom';
import { useLogsStore } from '../store/logsStore';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { fetchLogs } = useLogsStore();

  useEffect(() => {
    if (user?.role === 'system-admin') {
      fetchLogs();
    }
  }, [user, fetchLogs]);

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
            onClick={() => navigate('/systemadminreport')}
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
        {user.role === 'system-admin' ? <RecentActivityLog /> : <RecentRequests />}
        <AnalysisCard />
      </div>
    </div>
  );
};

export default Dashboard;