import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';
import { fetchRepairRequests } from '../services/api';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';

const RepairItems: React.FC = () => {
  const { approveRequest, denyRequest } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [repairRequests, setRepairRequests] = useState<any[]>([]);
  const [photoModal, setPhotoModal] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const repairRequestsData = await fetchRepairRequests();
      setRepairRequests(repairRequestsData);
      await fetchItems();
      setIsLoading(false);
    };
    load();
  }, []);

  const handleApprove = async (request: any) => {
    try {
      await approveRequest(request.id, '', undefined);
      toast.success('Request approved.');
      setRepairRequests(repairRequests.map(r => 
        r.id === request.id ? { ...r, status: 'repair-in-process' } : r
      ));
    } catch {
      toast.error('Failed to approve request.');
    }
  };

  const handleDeny = async (request: any) => {
    try {
      await denyRequest(request.id, '', 'Denied by admin');
      toast.success('Request denied.');
    } catch {
      toast.error('Failed to deny request.');
    }
  };

  const handleMarkAsDamaged = async (request: any) => {
    console.log("Attempting to mark request as damaged:", request);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      return;
    }

    // Support both object and id for issued_item
    const issuedItemId = typeof request.issued_item === 'object' && request.issued_item !== null
      ? request.issued_item.id
      : request.issued_item;

    if (!issuedItemId) {
      console.error('Repair request object:', request); // Debug log
      toast.error('Issued item details are missing for this repair request. Please ensure the item has been issued before marking as damaged.');
      return;
    }

    try {
      const damagedItemData = {
        issued_item: issuedItemId,
        repair_request: request.id, // Add the repair request ID
        damage_description: request.description,
      };

      await axios.post(`${API_URL}/api/damaged-items/`, damagedItemData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Item marked as damaged and added to damaged items list.');
      setRepairRequests(repairRequests.map(r => 
        r.id === request.id ? { ...r, status: 'marked-damaged' } : r
      ));
    } catch (error) {
      console.error('Error marking item as damaged:', error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        toast.error('This item has already been marked as damaged.');
         setRepairRequests(repairRequests.map(r => 
          r.id === request.id ? { ...r, status: 'marked-damaged' } : r
        ));
      } else if (axios.isAxiosError(error) && error.response?.status === 500) {
        toast.error('Server error occurred. Please try again later.');
      } else {
        toast.error('Failed to mark item as damaged.');
      }
    }
  };

  const getPictureUrl = (r: any) => {
    if (!r.picture) return null;
    if (r.picture.startsWith('http')) return r.picture;
    return `http://localhost:8000${r.picture.startsWith('/media/') ? r.picture : '/media/' + r.picture}`;
  };

  const columns = [
    { header: 'Request Date', accessor: (r: any) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-' },
    { header: 'Category', accessor: (r: any) => r.category || (items.find((i: any) => i.id === r.item)?.category || '-') },
    { header: 'Item', accessor: (r: any) => r.item_name || (items.find((i: any) => i.id === r.item)?.name || '-') },
    { header: 'Requested By', accessor: (r: any) => r.requested_by_name || '-' },
    { header: 'Picture', accessor: (r: any) => {
      const url = getPictureUrl(r);
      return url ? (
        <Button size="sm" variant="secondary" onClick={() => setPhotoModal({ open: true, url })}>View Photo</Button>
      ) : '-';
    } },
    { header: 'Description', accessor: (r: any) => r.description || '-' },
    { header: 'Status', accessor: (r: any) => r.status },
    {
      header: 'Actions',
      accessor: (r: any) => {
        if (r.status === 'marked-damaged') {
          return <span className="text-red-600 font-semibold">Marked Damaged</span>;
        }
         if (r.status === 'repair-in-process') {
          return <span className="text-yellow-600 font-semibold">Repair in process</span>;
        }
        return (
        <div className="flex gap-2">
          <Button size="sm" variant="success" onClick={() => handleApprove(r)} disabled={r.status !== 'pending'}>Repair</Button>
            <Button size="sm" variant="danger" onClick={() => handleMarkAsDamaged(r)} disabled={r.status !== 'pending'}>Damaged</Button>
        </div>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Repair Items" description="View all repair item requests, including serial number and picture." />
      <div className="mt-8">
        <Table
          columns={columns}
          data={repairRequests}
          keyExtractor={r => r.id}
          isLoading={isLoading}
          emptyMessage="No repair requests found."
        />
      </div>
      <SimpleModal open={photoModal.open} onClose={() => setPhotoModal({ open: false, url: null })} title="Photo">
        {photoModal.url && <img src={photoModal.url} alt="Attachment" style={{ maxWidth: 500, maxHeight: 500 }} />}
      </SimpleModal>
    </div>
  );
};

export default RepairItems;
