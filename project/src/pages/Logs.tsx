import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

interface Log {
  timestamp: string;
  user: string | { username: string }; // user can be a string or an object with a username property
  action: string;
  details: string;
}

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]); // Explicitly type the logs state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token'); // Get token from localStorage
        if (!token) {
          throw new Error('No authentication token found.');
        }
        const response = await axios.get(`${API_URL}/logs/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(response.data)) {
          setLogs(response.data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } else {
          console.error('Unexpected response format:', response.data);
          setLogs([]); // Fallback to an empty array
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
        setLogs([]); // Fallback to an empty array in case of error
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return <div>Loading logs...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">System Logs</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Timestamp</th>
              <th className="px-4 py-2 border-b">User</th>
              <th className="px-4 py-2 border-b">Action</th>
              <th className="px-4 py-2 border-b">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="px-4 py-2 border-b">{log.timestamp}</td>
                <td className="px-4 py-2 border-b">{log.user && typeof log.user === 'object' && 'username' in log.user ? log.user.username : log.user}</td>
                <td className="px-4 py-2 border-b">{log.action}</td>
                <td className="px-4 py-2 border-b">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
