import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestsStore } from '../store/requestsStore';
import { useAuthStore } from '../store/authStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';
import { RequestType } from '../types';

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const requestTypes = [
  { value: 'new', label: 'New Item' },
  { value: 'repair', label: 'Repair' } // Added repair request type
];

const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addRequest } = useRequestsStore();
  const { fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'new',
    category: '',
    itemId: '',
    itemTrueId: '',
    quantity: '',
    priority: '',
    serialNumber: '',
    issueDescription: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [inUseItems, setInUseItems] = useState<any[]>([]); // State to store in-use items
  const [stockItems, setStockItems] = useState<any[]>([]); // State to store stock items

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    const fetchInUseItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/issued-items/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const text = await response.text();
        console.log('Raw in-use items response:', text);
        const data = JSON.parse(text);
        console.log('Fetched in-use items:', data);
        setInUseItems(data);
      } catch (error) {
        console.error('Failed to fetch in-use items:', error);
      }
    };

    fetchInUseItems();
  }, [user]);

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const token = localStorage.getItem('token'); // Corrected key to 'token'
        const response = await fetch('/api/items/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const text = await response.text(); // Log raw response text
        console.log('Raw stock items response:', text);
        const data = JSON.parse(text);
        console.log('Fetched stock items:', data); // Debugging log
        setStockItems(data);
      } catch (error) {
        console.error('Failed to fetch stock items:', error);
      }
    };

    fetchStockItems();
  }, []); // Fetch stock items on component mount

  const categories = useMemo(() => {
    if (!Array.isArray(inUseItems) || inUseItems.length === 0) {
      console.warn('No in-use items available to populate categories.');
      return [];
    }
    const cats = Array.from(new Set(inUseItems.map((item: any) => item.item_category)));
    return cats.map((cat: string) => ({ value: cat, label: cat }));
  }, [inUseItems]);

  const itemOptions = useMemo(() => {
    if (!formData.category) {
      console.warn('No category selected to filter items.');
      return [];
    }
    const filteredItems = inUseItems.filter((item: any) => item.item_category === formData.category);
    // Get unique item names
    const uniqueItemNames = Array.from(new Set(filteredItems.map((item: any) => item.item_name)));
    return uniqueItemNames.map(itemName => ({ value: itemName, label: itemName }));
  }, [inUseItems, formData.category]);

  const getSerialNumbersForItem = (itemName: string) => {
    return inUseItems
      .filter((item: any) => item.item_name === itemName)
      .map((item: any) => ({ value: item.serial_number, label: item.serial_number }));
  };

  const stockCategories = useMemo(() => {
    if (!Array.isArray(stockItems) || stockItems.length === 0) {
      console.warn('No stock items available to populate categories.');
      return [];
    }
    console.log('Stock items for categories:', stockItems); // Debugging log
    const cats = Array.from(new Set(stockItems.map((item: any) => item.category)));
    console.log('Mapped stock categories:', cats); // Debugging log
    return cats.map((cat: string) => ({ value: cat, label: cat }));
  }, [stockItems]);

  const stockItemOptions = useMemo(() => {
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

  const fileAccept = '.xlsx,.xls';
  const fileLabel = 'Attach Excel File (optional)';

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
      if (name === 'serialNumber' && prev.type === 'repair') {
        const foundItem = inUseItems.find((item: any) => item.item_name === prev.itemId && item.serial_number === value);
        return {
          ...prev,
          serialNumber: value.toString(),
          itemId: foundItem ? foundItem.id : '',
          itemTrueId: foundItem ? foundItem.item : '',
        };
      }
      return {
        ...prev,
        [name]: value.toString()
      };
    });
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.type) newErrors.type = 'Type is required';
    if (formData.type === 'new') {
      if (!formData.category) newErrors.category = 'Category is required';
      if (!formData.itemId || formData.itemId === '') newErrors.itemId = 'Item is required';
      if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) newErrors.quantity = 'Quantity is required and must be a positive number';
    } else if (formData.type === 'repair') {
      if (!formData.itemId || formData.itemId === '') newErrors.itemId = 'Item to Repair is required';
      if (!formData.serialNumber) newErrors.serialNumber = 'Serial Number is required';
      if (!formData.issueDescription) newErrors.issueDescription = 'Issue Description is required';
    }
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
      const payload: any = {
        type: formData.type as RequestType,
        priority: formData.priority,
      };
      if (formData.type === 'new') {
        payload.item = formData.itemId;
        payload.quantity = parseInt(formData.quantity);
      } else if (formData.type === 'repair') {
        payload.item = formData.itemTrueId;
        payload.issued_item = parseInt(formData.itemId, 10);
        payload.serialNumber = formData.serialNumber;
        payload.issueDescription = formData.issueDescription;
        payload.quantity = 1;
      }
      await addRequest(payload);
      toast.success('Request created successfully');
      navigate('/my-requests');
    } catch (error) {
      toast.error('Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (!validate()) return;
    setIsConfirmModalOpen(true);
  };

  const renderFormFields = () => {
    if (formData.type === 'repair') {
      return (
        <>
          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            options={[{ value: '', label: 'Select Category' }, ...categories]}
            required={true}
            error={errors.category}
          />
          <Select
            label="Item Name"
            name="itemId"
            value={formData.itemId}
            onChange={handleChange}
            options={[{ value: '', label: 'Select Item' }, ...itemOptions]}
            required={true}
            error={errors.itemId}
          />
          <Select
            label="Serial Number"
            name="serialNumber"
            value={formData.serialNumber}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select Serial Number' },
              ...(formData.itemId ? getSerialNumbersForItem(formData.itemId) : [])
            ]}
            required={true}
            error={errors.serialNumber}
          />
          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={[{ value: '', label: 'Select Priority' }, ...priorityOptions.filter(opt => opt.value !== '')]}
            required
            error={errors.priority}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="issueDescription"
              value={formData.issueDescription || ''}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
            {errors.issueDescription && <p className="mt-1 text-sm text-red-600">{errors.issueDescription}</p>}
          </div>
          <Input
            label="Photo of Damaged Item"
            name="attachment"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
        </>
      );
    }

    // Default form fields for 'new' type
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
        <Select
          label="Request Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          options={requestTypes}
          required={true}
          error={errors.type}
        />
        {renderFormFields()}
        {formData.type !== 'repair' && (
          <>
            <Select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={[{ value: '', label: 'Select Priority' }, ...priorityOptions.filter(opt => opt.value !== '')]}
              required
              error={errors.priority}
            />
            <Input
              label={fileLabel}
              name="attachment"
              type="file"
              accept={fileAccept}
              onChange={handleFileChange}
            />
          </>
        )}
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
              <h3 className="text-sm font-medium text-gray-500">Request Type</h3>
              <p className="mt-1">{requestTypes.find(rt => rt.value === formData.type)?.label}</p>
            </div>
          </div>
        </div>
      </SimpleModal>
    </div>
  );
};

export default NewRequest;