import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Button from '../components/ui/Button';

interface IssuedItem {
  id: number;
  assigned_date: string;
  expiration_date: string | null;
  serial_number: string;
}

interface LocationState {
  item_name: string;
  item_category: string;
  quantity: number;
  items: IssuedItem[];
}

const IssuedItemDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | undefined;

  if (!state) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <PageHeader title="Item Details" description="No item details found." />
        <Button onClick={() => navigate(-1)}>Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <PageHeader title="Item Details" description="Details for issued item group" />
      <div className="bg-white rounded shadow p-6 mt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Item Name</h3>
            <p className="mt-1">{state.item_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Category</h3>
            <p className="mt-1">{state.item_category}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
            <p className="mt-1">{state.items.length}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mt-4 mb-2">Issued Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">{item.serial_number}</td>
                    <td className="px-4 py-2">{item.assigned_date}</td>
                    <td className="px-4 py-2">{item.expiration_date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Button className="mt-6" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default IssuedItemDetails;