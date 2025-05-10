import React from 'react';
import { useLogsStore } from '../store/logsStore';
import { formatRelativeTime } from '../utils/formatters';
import Card from './ui/Card';

const RecentActivityLog: React.FC = () => {
  const { logs } = useLogsStore();

  // Get the 10 most recent logs
  const recentLogs = logs.slice(0, 10);

  return (
    <Card title="Recent Activity" className="h-full">
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
                        <div className="flex">
                          <div className="mr-0.5">
                            <span className="font-medium text-slate-900">{log.userName}</span>
                          </div>
                          <p>
                            {log.action}
                          </p>
                        </div>
                        <p className="mt-0.5">
                          {log.details}
                        </p>
                        <p className="mt-2 text-xs">
                          {formatRelativeTime(log.timestamp)}
                        </p>
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