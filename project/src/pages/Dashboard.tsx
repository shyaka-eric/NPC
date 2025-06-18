import React, { useEffect, useState } from 'react';
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
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { fetchLogs } = useLogsStore();

  const [rangeType, setRangeType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const today = new Date();

  // Helper to get date range
  const getRange = () => {
    switch (rangeType) {
      case 'daily':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'weekly':
        return { start: startOfWeek(today), end: endOfWeek(today) };
      case 'monthly':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'custom':
        if (customStart && customEnd) {
          return { start: startOfDay(parseISO(customStart)), end: endOfDay(parseISO(customEnd)) };
        }
        return { start: startOfDay(today), end: endOfDay(today) };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };
  const { start, end } = getRange();

  // Helper to check if a date is in range (accepts string or Date)
  const inRange = (dateVal: string | Date | undefined) => {
    if (!dateVal) return false;
    let date: Date;
    if (typeof dateVal === 'string') {
      date = parseISO(dateVal);
    } else {
      date = dateVal;
    }
    return isWithinInterval(date, { start, end });
  };

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

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return `${greeting}, ${fullName}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader 
        title={getGreeting()} 
        description={`Welcome to your ${user.role.replace('-', ' ')} dashboard`}
        actions={renderActionButton()}
      />
      
      <DashboardStats 
        rangeType={rangeType}
        setRangeType={setRangeType}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        inRange={inRange}
      />
      
      <div className="mt-8 flex justify-center">
        {user.role === 'system-admin' ? (
          <div className="w-full max-w-4xl">
            <RecentActivityLog />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentRequests 
              rangeType={rangeType} 
              customStart={customStart} 
              customEnd={customEnd} 
              inRange={inRange}
            />
            <AnalysisCard />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;