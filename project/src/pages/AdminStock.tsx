import React, { useState, useMemo, useEffect } from 'react';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Pagination from '../components/Pagination';
// import Select from '../components/ui/Select';
// import StatusBadge from '../components/ui/StatusBadge';

const AdminStock: React.FC = () => {
  const { items, fetchItems } = useItemsStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items]);

  const filtered = items.filter(item =>
    (category ? item.category === category : true) &&
    (search ? item.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Stock Availability" description="View all items in stock." />
      <div className="flex gap-4 mb-4">
        <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        {/* <Select name="category" value={category} onChange={e => setCategory(e.target.value)} options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]} /> */}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Serial Number</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Expiration Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Last Updated</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {paginatedItems.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-2 whitespace-nowrap">{item.serial_number}</td>
                <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{item.category}</td>
                <td className="px-4 py-2 whitespace-nowrap">{item.quantity}</td>
                <td className="px-4 py-2 whitespace-nowrap">{item.expiration_date ? item.expiration_date.split('T')[0] : '-'}</td>
                <td className="px-4 py-2 whitespace-nowrap">{item.last_updated ? item.last_updated.split('T')[0] : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default AdminStock; 