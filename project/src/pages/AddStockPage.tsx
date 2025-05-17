import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';

const AddStockPage: React.FC = () => {
  const navigate = useNavigate();
  const addItem = useItemsStore(state => state.addItem);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expiration_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addItem({
        name: formData.name,
        category: formData.category,
        quantity: Number(formData.quantity),
        expirationDate: formData.expiration_date ? new Date(formData.expiration_date) : undefined,
      });
      navigate('/stock-management');
    } catch (error) {
      alert('Failed to add item.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Add New Stock Item</h1>
        <Button
          variant="secondary"
          onClick={() => navigate('/stock-management')}
        >
          Back to Stock Management
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Item Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        />
        <Input
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          required
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/stock-management')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Item
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddStockPage;