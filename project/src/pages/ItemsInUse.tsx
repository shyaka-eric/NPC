import React, { useEffect, useState } from 'react';
import { useItemsStore } from '../store/itemsStore';
import { useAuthStore } from '../store/authStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table'; // Correct import for Table
import Pagination from '../components/Pagination';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import { IssuedItemModel } from '../models/item.model';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 15;

// Define TableColumn type locally since it's not exported
interface TableColumn<T> {
  header: React.ReactNode;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

const ItemsInUse: React.FC = () => {
  const { user } = useAuthStore();
  const { issuedItems, fetchIssuedItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const loadIssuedItems = async () => {
      setIsLoading(true);
      try {
        await fetchIssuedItems();
      } catch (error) {
        toast.error('Failed to load issued items');
      } finally {
        setIsLoading(false);
      }
    };
    loadIssuedItems();
  }, [fetchIssuedItems]);

  // Filter issued items for the current user (force string comparison for robustness)
  React.useEffect(() => {
    if (issuedItems && user) {
      console.log('User ID:', user.id);
      console.log('Issued Items:', issuedItems.map(item => ({ id: item.id, assigned_to: item.assigned_to })));
    }
  }, [issuedItems, user]);

  // Update filtering logic to use `assigned_to` instead of `assigned_to_id`
  const itemsInUse = (issuedItems || []).filter(item => {
    const isAssignedToUser = String(item.assigned_to) === String(user?.id);
    console.log('Filtering Item:', {
      itemId: item.id,
      assignedTo: item.assigned_to,
      isAssignedToUser
    });
    return isAssignedToUser;
  });
  console.log('Filtered Items In Use:', itemsInUse);

  // Group issued items by item_name and item_category
  const groupedItems = React.useMemo(() => {
    const map = new Map<string, { item_name: string; item_category: string; quantity: number; items: IssuedItemModel[] }>();
    itemsInUse.forEach(item => {
      const key = `${item.item_name}|${item.item_category}`;
      console.log('Grouping Item:', {
        itemId: item.id,
        itemName: item.item_name,
        itemCategory: item.item_category,
        assignedQuantity: item.assigned_quantity,
        key
      });
      if (!map.has(key)) {
        map.set(key, {
          item_name: item.item_name,
          item_category: item.item_category,
          quantity: 1, // Each issued item is one unit
          items: [item],
        });
      } else {
        const entry = map.get(key)!;
        entry.quantity += 1; // Sum up by 1 for each issued item
        entry.items.push(item);
      }
    });
    console.log('Grouped Items:', Array.from(map.values()));
    return Array.from(map.values());
  }, [itemsInUse]);

  const totalPages = Math.ceil(itemsInUse.length / ITEMS_PER_PAGE);
  const paginatedItems = groupedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  console.log('Paginated Items:', paginatedItems);

  const handleViewItem = (row: { item_name: string; item_category: string; quantity: number; items: IssuedItemModel[] }) => {
    // Removed serial_numbers mapping logic as `serial_number` is no longer used
    console.log('Navigating with data:', row);
    navigate('/issued-item-details', { state: row });
  };

  // Table columns for grouped items
  const columns: TableColumn<{
    item_name: string;
    item_category: string;
    quantity: number;
    items: IssuedItemModel[];
  }>[] = [
    {
      header: 'Item Name',
      accessor: 'item_name',
      className: 'font-medium'
    },
    {
      header: 'Category',
      accessor: 'item_category'
    },
    {
      header: 'Quantity',
      accessor: (row: { quantity: number }) => row.quantity
    },
    {
      header: 'Actions',
      accessor: (row: { item_name: string; item_category: string; quantity: number; items: IssuedItemModel[] }) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleViewItem(row)}
        >
          View Details
        </Button>
      )
    }
  ];

  // Log the API response for issuedItems
  useEffect(() => {
    if (issuedItems) {
      console.log('API Response:', issuedItems);
    }
  }, [issuedItems]);

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
          keyExtractor={row => row.item_name + '|' + row.item_category}
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
    </div>
  );
};

export default ItemsInUse;