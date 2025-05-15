import React, { useEffect, useState } from 'react';
import { useItemsStore } from '../store/itemsStore';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import { formatDate } from '../utils/formatters';
import Pagination from '../components/Pagination';
import SimpleModal from '../components/ui/SimpleModal';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 15;

const ItemsInUse: React.FC = () => {
  const { user } = useAuthStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        await fetchItems();
      } catch (error) {
        toast.error('Failed to load items');
      } finally {
        setIsLoading(false);
      }
    };
    loadItems();
  }, [fetchItems]);

  // Debug output
  useEffect(() => {
    console.log('All items from backend:', items);
    console.log('Filtered itemsInUse:', items.filter(item => item.assigned_to_id === user?.id));
  }, [items, user]);

  // Filter items in use by the current user (now just assigned items)
  const itemsInUse = items.filter(item => item.assigned_to_id === user?.id);
  const totalPages = Math.ceil(itemsInUse.length / ITEMS_PER_PAGE);
  const paginatedItems = itemsInUse.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const columns = [
    {
      header: 'Item Name',
      accessor: 'name',
      className: 'font-medium'
    },
    {
      header: 'Category',
      accessor: 'category'
    },
    {
      header: 'Quantity',
      accessor: 'assigned_quantity'
    },
    {
      header: 'Assigned Date',
      accessor: (item: any) => formatDate(item.assigned_date)
    },
    {
      header: 'Actions',
      accessor: (item: any) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleViewItem(item)}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Items in Use"
        description="View items currently assigned to you"
      />

      <div className="mt-8">
        <Table
          columns={columns}
          data={paginatedItems}
          keyExtractor={item => item.id}
          isLoading={isLoading}
          emptyMessage="You don't have any items assigned to you."
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      </div>

      <SimpleModal
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Item Details"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Item Name</h3>
                <p className="mt-1">{selectedItem.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1">{selectedItem.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                <p className="mt-1">{selectedItem.assigned_quantity}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Assigned Date</h3>
                <p className="mt-1">{formatDate(selectedItem.assigned_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1">{formatDate(selectedItem.updatedAt)}</p>
              </div>
            </div>
            {selectedItem.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{selectedItem.description}</p>
              </div>
            )}
          </div>
        )}
      </SimpleModal>
    </div>
  );
};

export default ItemsInUse; 