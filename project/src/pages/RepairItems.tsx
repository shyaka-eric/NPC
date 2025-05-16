import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';
import { fetchRepairRequests } from '../services/api';

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

  const columns = [
    { header: 'Request Date', accessor: (r: any) => new Date(r.requested_at).toLocaleDateString() },
    { header: 'Category', accessor: (r: any) => r.category || (items.find((i: any) => i.id === r.item)?.category || '-') },
    { header: 'Item', accessor: (r: any) => r.item_name || (items.find((i: any) => i.id === r.item)?.name || '-') },
    // Show serial number from issued_item if present
    { header: 'Serial Number', accessor: (r: any) => r.issued_item?.serial_number || '-' },
    // Show 'View Photo' button if attachment exists
    { header: 'Picture', accessor: (r: any) => (r.attachments && r.attachments.length > 0) ? (
      <Button size="sm" variant="secondary" onClick={() => setPhotoModal({ open: true, url: r.attachments[0] })}>View Photo</Button>
    ) : '-' },
    { header: 'Purpose', accessor: (r: any) => r.purpose || '-' },
    { header: 'Status', accessor: (r: any) => r.status },
    {
      header: 'Actions',
      accessor: (r: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="success" onClick={() => handleApprove(r)} disabled={r.status !== 'pending'}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => handleDeny(r)} disabled={r.status !== 'pending'}>Deny</Button>
        </div>
      )
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
