import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useRequestsStore } from '../store/requestsStore';
import { formatRelativeTime } from '../utils/formatters';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import Button from './ui/Button';
import Modal from './ui/Modal';

const RecentRequests: React.FC = () => {
  const { user } = useAuthStore();
  const { requests, fetchRequests } = useRequestsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        await fetchRequests();
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [fetchRequests]);

  if (!user) return null;

  // Helper to safely format relative time
  const safeFormatRelativeTime = (date: any) => {
    if (!date) return '-';
    try {
      return formatRelativeTime(date);
    } catch {
      return '-';
    }
  };

  // Get recent requests based on user role
  const getRecentRequests = () => {
    let filteredRequests: typeof requests = [];

    switch (user.role) {
      case 'unit-leader':
        // For unit leaders, show their own requests
        filteredRequests = requests.filter(req => String(req.requested_by) === String(user.id));
        break;
      case 'admin':
        // For admins, prioritize pending requests
        filteredRequests = requests.filter(req => req.status === 'pending');
        if (filteredRequests.length < 5) {
          // If we have less than 5 pending, add some recent ones of other statuses
          const otherRequests = requests
            .filter(req => req.status !== 'pending')
            .slice(0, 5 - filteredRequests.length);
          filteredRequests = [...filteredRequests, ...otherRequests];
        }
        break;
      case 'logistics-officer':
        // For logistics officers, show approved requests that need to be issued
        filteredRequests = requests.filter(req => req.status === 'approved');
        if (filteredRequests.length < 5) {
          // If we have less than 5 approved, add some recently issued
          const issuedRequests = requests
            .filter(req => req.status === 'issued')
            .slice(0, 5 - filteredRequests.length);
          filteredRequests = [...filteredRequests, ...issuedRequests];
        }
        break;
      case 'system-admin':
        // For system admins, show most recent requests of any status
        filteredRequests = requests;
        break;
      default:
        filteredRequests = [];
    }

    // Sort by most recent and take the top 5
    return filteredRequests
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      .slice(0, 5);
  };

  const recentRequests = getRecentRequests();

  return (
    <Card title="Recent Requests" className="h-full">
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse flex space-x-2 items-center">
            <div className="h-4 w-4 bg-slate-300 rounded-full"></div>
            <div className="h-4 w-20 bg-slate-300 rounded"></div>
            <span className="text-sm text-slate-500">Loading...</span>
          </div>
        </div>
      ) : recentRequests.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-500">
          No requests found
        </div>
      ) : (
        <div className="flow-root">
          <ul className="divide-y divide-slate-200">
            {recentRequests.map((request) => (
              <li key={request.id} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {request.item_name || '-'}
                    </p>
                    <div className="flex items-center mt-1">
                      <StatusBadge status={request.status} />
                      <p className="ml-2 text-xs text-slate-500">
                        {safeFormatRelativeTime(request.requestedAt)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {request.type === 'new' ? 'New Request' : 'Repair Request'} by {request.requestedByName || '-'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => setSelectedRequest(request)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Request Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Request Details"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-2">
            <div><span className="font-semibold">Item:</span> {selectedRequest.itemName || '-'}</div>
            <div><span className="font-semibold">Type:</span> {selectedRequest.type === 'new' ? 'New Request' : 'Repair Request'}</div>
            <div><span className="font-semibold">Quantity:</span> {selectedRequest.quantity}</div>
            <div><span className="font-semibold">Requested By:</span> {selectedRequest.requestedByName || '-'}</div>
            <div><span className="font-semibold">Status:</span> <StatusBadge status={selectedRequest.status} /></div>
            <div><span className="font-semibold">Requested At:</span> {selectedRequest.requestedAt ? new Date(selectedRequest.requestedAt).toLocaleString() : '-'}</div>
            {selectedRequest.reason && (
              <div><span className="font-semibold">Reason:</span> {selectedRequest.reason}</div>
            )}
            {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
              <div>
                <span className="font-semibold">Attachments:</span>
                <ul className="list-disc ml-6">
                  {selectedRequest.attachments.map((url: string, idx: number) => (
                    <li key={idx}><a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Attachment {idx + 1}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default RecentRequests;