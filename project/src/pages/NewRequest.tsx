import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useItemsStore } from '../store/itemsStore';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';
import { API_URL } from '../config';

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    itemId: '',
    quantity: '',
    priority: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [stockItems, setStockItems] = useState<any[]>([]); // State to store stock items

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await api.get('items/');
        setStockItems(response.data);
      } catch (error) {
        console.error('Failed to fetch stock items:', error);
      }
    };

    fetchStockItems();
  }, []); // Fetch stock items on component mount

  const stockCategories = React.useMemo(() => {
    if (!Array.isArray(stockItems) || stockItems.length === 0) {
      console.warn('No stock items available to populate categories.');
      return [];
    }
    console.log('Stock items for categories:', stockItems); // Debugging log
    const cats = Array.from(new Set(stockItems.map((item: any) => item.category)));
    console.log('Mapped stock categories:', cats); // Debugging log
    return cats.map((cat: string) => ({ value: cat, label: cat }));
  }, [stockItems]);

  const stockItemOptions = React.useMemo(() => {
    if (!formData.category) {
      console.warn('No category selected to filter stock items.');
      return [];
    }
    console.log('Selected stock category:', formData.category); // Debugging log
    console.log('Stock items for item options:', stockItems); // Debugging log
    const filteredItems = stockItems.filter((item: any) => item.category === formData.category);
    console.log('Filtered stock items for selected category:', filteredItems); // Debugging log
    return filteredItems.map((item: any) => ({ value: item.id, label: item.name }));
  }, [stockItems, formData.category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'category') {
        return {
          ...prev,
          category: value.toString(),
          itemId: '',
        };
      }
      return {
        ...prev,
        [name]: value.toString()
      };
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.itemId || formData.itemId === '') newErrors.itemId = 'Item is required';
    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) newErrors.quantity = 'Quantity is required and must be a positive number';
    if (!formData.priority || formData.priority === '') newErrors.priority = 'Priority is required';
    setErrors(newErrors);
    setShowValidationSummary(Object.keys(newErrors).length > 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    if (!validate()) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload: any = {
        category: formData.category,
        item: formData.itemId,
        quantity: parseInt(formData.quantity),
        priority: formData.priority,
        type: 'new', // Always send type for backend compatibility
      };
      const response = await fetch(`${API_URL}/requests/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create request');
      }
      toast.success('Request created successfully');
      navigate('/my-requests');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (!validate()) return;
    setIsConfirmModalOpen(true);
  };

  const renderFormFields = () => {
    // Only render fields for 'new' type
    return (
      <>
        <Select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={[{ value: '', label: 'Select Category' }, ...stockCategories]}
          required={true}
          error={errors.category}
        />
        <Select
          label="Item"
          name="itemId"
          value={formData.itemId}
          onChange={handleChange}
          options={[{ value: '', label: 'Select Item' }, ...stockItemOptions]}
          required={true}
          error={errors.itemId}
        />
        <Input
          label="Quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleChange}
          required
          error={errors.quantity}
        />
      </>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="New Request"
        description="Create a new item request"
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/my-requests')}
          >
            Back to My Requests
          </Button>
        }
      />
      <form onSubmit={handleSubmit} className="space-y-6 mt-8">
        {showValidationSummary && Object.keys(errors).length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Please fix the following errors:</strong>
            <ul className="list-disc list-inside mt-2">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {renderFormFields()}
        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          options={[{ value: '', label: 'Select Priority' }, ...priorityOptions.filter(opt => opt.value !== '')]}
          required
          error={errors.priority}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/my-requests')}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            icon={<Plus className="h-4 w-4" />}
            onClick={handleConfirmSubmit}
            isLoading={isLoading}
          >
            Create Request
          </Button>
        </div>
      </form>
      <SimpleModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Request"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => { setIsConfirmModalOpen(false); handleSubmit(); }}
              isLoading={isLoading}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p>Please review your request details:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1">{stockCategories.find(cat => cat.value === formData.category)?.label}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Item</h3>
              <p className="mt-1">{stockItemOptions.find(opt => opt.value === formData.itemId)?.label}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
              <p className="mt-1">{formData.quantity}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Priority</h3>
              <p className="mt-1">{priorityOptions.find(opt => opt.value === formData.priority)?.label}</p>
            </div>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
};

export default NewRequest;