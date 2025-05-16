import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import StatusBadge from '../components/ui/StatusBadge';
import Select from '../components/ui/Select';
import { formatDate } from '../utils/formatters';
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: 'issued', label: 'Issued' },
  { value: 'completed', label: 'Completed' }
];

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'new', label: 'New Item' }
];

const ITEMS_PER_PAGE = 15;

const Requests: React.FC = () => {
  const { requests, fetchRequests, approveRequest, denyRequest } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        await fetchRequests();
      } catch (error) {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Only show new item requests
  const newItemRequests = requests.filter(r => r.type === 'new');

  const filteredRequests = newItemRequests.filter(r => {
    return (
      (statusFilter ? r.status === statusFilter : true)
      // Remove typeFilter check since only 'new' requests are shown
    );
  });

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Helper to safely format dates
  const safeFormatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '-';
      return formatDate(d);
    } catch {
      return '-';
    }
  };

  const columns = [
    {
      header: 'Request Date',
      accessor: (request: any) => safeFormatDate(request.requested_at)
    },
    {
      header: 'Type',
      accessor: (request: any) => request.type.charAt(0).toUpperCase() + request.type.slice(1)
    },
    {
      header: 'Category',
      accessor: (request: any) => {
        const item = items.find(i => String(i.id) === String(request.item));
        return item?.category || '-';
      }
    },
    {
      header: 'Item',
      accessor: (request: any) => {
        const item = items.find(i => String(i.id) === String(request.item));
        return item?.name || '-';
      },
      className: 'font-medium'
    },
    {
      header: 'Quantity',
      accessor: 'quantity'
    },
    {
      header: 'Requested By',
      accessor: (request: any) => request.requested_by_name || request.requested_by || '-'
    },
    {
      header: 'Status',
      accessor: (request: any) => <StatusBadge status={request.status} />
    },
    {
      header: 'Actions',
      accessor: (request: any) => {
        if (request.status === 'pending') {
          return (
            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={async () => {
                  try {
                    await approveRequest(request.id, '', undefined);
                    toast.success('Request approved successfully');
                  } catch (error) {
                    toast.error('Failed to approve request');
                  }
                }}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  try {
                    await denyRequest(request.id, '', 'Denied by admin');
                    toast.success('Request denied successfully');
                  } catch (error) {
                    toast.error('Failed to deny request');
                  }
                }}
              >
                Deny
              </Button>
            </div>
          );
        } else {
          return <span className="text-slate-400">Completed</span>;
        }
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Requests"
        description="View and filter all item and repair requests"
      />
      <div className="flex gap-4 mb-4">
        <Select
          label="Status"
          name="status"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={statusOptions}
        />
        <Select
          label="Type"
          name="type"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          options={typeOptions}
        />
      </div>
      <Table
        columns={columns}
        data={paginatedRequests}
        keyExtractor={request => request.id}
        isLoading={isLoading}
        emptyMessage="No new item requests found."
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="mt-6"
      />
    </div>
  );
};

export default Requests;