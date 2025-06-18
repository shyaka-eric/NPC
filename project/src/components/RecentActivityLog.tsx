import React, { useEffect } from 'react';
import { useLogsStore } from '../store/logsStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import Card from './ui/Card';

const RecentActivityLog: React.FC = () => {
  const { logs } = useLogsStore();
  const { users, fetchUsers } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Map userId or user object to display name
  const getUserDisplayName = (log: any) => {
    // If log.user is an object with username or name, use it
    if (log.user && typeof log.user === 'object') {
      return log.user.name || log.user.username || 'Unknown User';
    }
    // If log.userName exists, use it
    if (log.userName) return log.userName;
    // If log.userId exists, try to map from users list
    if (log.userId) {
      const user = users.find(u => u.id === log.userId);
      if (user) return user.name || user.username || 'Unknown User';
    }
    return 'Unknown User';
  };

  // Get the 5 most recent logs (latest first)
  const recentLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  return (
    <Card className="h-full">
      <div className="flex justify-between items-center px-2 pb-2">
        <h3 className="text-lg font-medium text-slate-900">Recent Activity</h3>
        <button
          className="text-blue-700 text-sm font-semibold hover:underline focus:outline-none ml-auto"
          style={{ minWidth: 100 }}
          onClick={() => navigate('/logs')}
        >
          View All Logs
        </button>
      </div>
      <div className="flow-root">
        <ul className="-mb-8">
          {recentLogs.length === 0 ? (
            <li className="py-6 text-center text-sm text-slate-500">
              No recent activity
            </li>
          ) : (
            recentLogs.map((log, idx) => (
              <li key={log.id}>
                <div className="relative pb-8">
                  {idx !== recentLogs.length - 1 ? (
                    <span
                      className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex items-start space-x-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{log.action}</span>
                          <span>{log.details}</span>
                          <span className="text-xs text-slate-400 mt-1"><b>{getUserDisplayName(log)}</b> &middot; {new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </Card>
  );
};

export default RecentActivityLog;