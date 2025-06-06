import React, { useEffect } from 'react';
import { fetchDeletedItems } from '../services/itemsApi';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Pagination from '../components/Pagination';
import { formatDate } from '../utils/formatters';

const DeletedItems: React.FC = () => {
  const [deletedItems, setDeletedItems] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  useEffect(() => {
    const loadDeletedItems = async () => {
      setIsLoading(true);
      try {
        const data = await fetchDeletedItems();
        setDeletedItems(data.results || data); // handle pagination or plain array
      } catch (e) {
        setDeletedItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeletedItems();
  }, []);

  const ITEMS_PER_PAGE = 15;
  const totalPages = Math.ceil(deletedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = deletedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Expiration Date', accessor: (item: any) => item.expiration_date ? formatDate(item.expiration_date) : '-' },
    { header: 'Last Updated', accessor: (item: any) => item.last_updated ? formatDate(item.last_updated) : '-' },
    { header: 'Reason', accessor: (item: any) => item.deletion_reason || '-' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Deleted Items" description="Track all deleted stock items." />
      <div className="mt-8">
        <Table
          columns={columns}
          data={paginatedItems}
          keyExtractor={item => item.id}
          isLoading={isLoading}
          emptyMessage="No deleted items found."
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

export default DeletedItems;
