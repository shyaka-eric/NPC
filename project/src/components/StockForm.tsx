import React, { useState } from 'react';
import { useItemsStore } from '../store/itemsStore';
import { toast } from 'sonner';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

interface StockFormProps {
  item?: any;
  onClose: () => void;
}

const StockForm: React.FC<StockFormProps> = ({ item, onClose }) => {
  const { addItem, updateItem, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    description: item?.description || '',
    quantity: item?.quantity || 0,
    status: item?.status || 'in-stock',
    expirationDate: item?.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate expiration date is not in the past
    if (formData.expirationDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ignore time
      const expDate = new Date(formData.expirationDate);
      if (expDate < today) {
        toast.error('Expiration date cannot be in the past.');
        return;
      }
    }
    setIsLoading(true);

    try {
      // Convert expirationDate to Date if present
      const payload = {
        ...formData,
        expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined
      };
      if (item) {
        await updateItem(item.id, payload);
        toast.success('Item updated successfully');
      } else {
        // Add createdAt and updatedAt for new items
        await addItem({
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Item added successfully');
      }
      await fetchItems();
      onClose();
    } catch (error) {
      toast.error('Failed to save item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const categoryOptions = [
    { value: '', label: 'Select Category' },
    { value: 'Uniform', label: 'Uniform' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Office Supplies', label: 'Office Supplies' },
    { value: 'Tools', label: 'Tools' },
    { value: 'Vehicles', label: 'Vehicles' },
    { value: 'Communications', label: 'Communications' }
  ];

  const statusOptions = [
    { value: 'in-stock', label: 'In Stock' },
    { value: 'in-use', label: 'In Use' },
    { value: 'under-repair', label: 'Under Repair' },
    { value: 'damaged', label: 'Damaged' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Item Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        fullWidth
      />

      <Select
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleChange}
        options={categoryOptions}
        required
        fullWidth
      />

      <Input
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        fullWidth
      />

      <Input
        label="Quantity"
        name="quantity"
        type="number"
        min="0"
        value={formData.quantity}
        onChange={handleChange}
        required
        fullWidth
      />

      <Select
        label="Status"
        name="status"
        value={formData.status}
        onChange={handleChange}
        options={statusOptions}
        required
        fullWidth
      />

      <Input
        label="Expiration Date"
        name="expirationDate"
        type="date"
        value={formData.expirationDate}
        onChange={handleChange}
        min={(() => {
          // Always use the current date in the user's local timezone
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const offset = now.getTimezoneOffset();
          const localDate = new Date(now.getTime() - offset * 60 * 1000);
          return localDate.toISOString().split('T')[0];
        })()}
        fullWidth
      />

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {item ? 'Update' : 'Add'} Item
        </Button>
      </div>
    </form>
  );
};

export default StockForm;