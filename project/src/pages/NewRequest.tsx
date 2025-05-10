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

const priorityOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const requestTypes = [
  { value: 'new', label: 'New Item' },
  { value: 'repair', label: 'Repair' }
];

const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addRequest } = useRequestsStore();
  const { items, fetchItems } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'new',
    category: '',
    itemId: '',
    quantity: '',
    priority: '',
    purpose: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // For repair: categories/items from in-use items of the user
  const inUseItems = useMemo(() => items.filter(item => item.status === 'in-use' && item.assignedTo === user?.id), [items, user]);
  const inUseCategories = useMemo(() => {
    const cats = Array.from(new Set(inUseItems.map(item => item.category)));
    return cats.map(cat => ({ value: cat, label: cat }));
  }, [inUseItems]);
  const inUseFilteredItems = useMemo(() => {
    return inUseItems.filter(item => item.category === formData.category);
  }, [inUseItems, formData.category]);
  const inUseItemOptions = inUseFilteredItems.map(item => ({ value: item.id, label: item.name }));

  // For new: categories/items from all items
  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(item => item.category)));
    return cats.map(cat => ({ value: cat, label: cat }));
  }, [items]);
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === formData.category);
  }, [items, formData.category]);
  const itemOptions = filteredItems.map(item => ({ value: item.id, label: item.name }));

  // File input accept type and label
  const fileAccept = formData.type === 'repair' ? 'image/*' : '.xlsx,.xls';
  const fileLabel = formData.type === 'repair' ? 'Attach Image of Damaged Item (required)' : 'Attach Excel File (optional)';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Always set as string
    setFormData(prev => ({
      ...prev,
      [name]: value.toString()
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    // Reset item/category if type changes
    if (name === 'type') {
      setFormData(prev => ({ ...prev, category: '', itemId: '', quantity: '' }));
      setFile(null);
    }
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
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.itemId || formData.itemId === '') newErrors.itemId = 'Item is required';
    if (!formData.priority || formData.priority === '') newErrors.priority = 'Priority is required';
    if (formData.type === 'new') {
      if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) newErrors.quantity = 'Quantity is required and must be a positive number';
    }
    if (formData.type === 'repair') {
      if (!file) newErrors.file = 'Image attachment is required';
      else if (file && !file.type.startsWith('image/')) newErrors.file = 'Attachment must be an image';
    }
    if (!formData.purpose && formData.type === 'new') newErrors.purpose = 'Purpose is required';
    setErrors(newErrors);
    setShowValidationSummary(Object.keys(newErrors).length > 0);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    console.log('SUBMIT', formData);
    if (!validate()) return;
    setIsLoading(true);
    try {
      const selectedItem = items.find(item => item.id === formData.itemId);
      await addRequest({
        type: formData.type,
        item: formData.itemId,
        quantity: formData.type === 'new' ? parseInt(formData.quantity) : undefined,
        priority: formData.priority,
        purpose: formData.purpose,
        requested_by: user.id,
        status: 'pending',
        attachments: file ? [file.name] : [],
      });
      toast.success('Request created successfully');
      navigate('/my-requests');
    } catch (error) {
      toast.error('Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    console.log('CONFIRM', formData);
    if (!validate()) return;
    setIsConfirmModalOpen(true);
  };

  // Dynamic options and fields
  const showQuantity = formData.type === 'new';
  const showPurpose = formData.type === 'new' || formData.type === 'repair';
  const showFileError = errors.file && formData.type === 'repair';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="New Request"
        description="Create a new item or repair request"
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
          required
          error={errors.type}
        />
        <Select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          options={formData.type === 'repair' ? inUseCategories : categories}
          required
          error={errors.category}
        />
        <Select
          label="Item"
          name="itemId"
          value={formData.itemId}
          onChange={handleChange}
          options={formData.type === 'repair' ? inUseItemOptions : itemOptions}
          required
          error={errors.itemId}
        />
        {showQuantity && (
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            error={errors.quantity}
          />
        )}
        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          options={priorityOptions}
          required
          error={errors.priority}
        />
        {showPurpose && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required={formData.type === 'new'}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
            {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>}
          </div>
        )}
        <Input
          label={fileLabel}
          name="attachment"
          type="file"
          accept={fileAccept}
          onChange={handleFileChange}
          required={formData.type === 'repair'}
        />
        {showFileError && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
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
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="mt-1">{formData.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Item</h3>
              <p className="mt-1">{(formData.type === 'repair' ? inUseItemOptions : itemOptions).find(opt => opt.value === formData.itemId)?.label}</p>
            </div>
            {showQuantity && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                <p className="mt-1">{formData.quantity}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Priority</h3>
              <p className="mt-1">{priorityOptions.find(opt => opt.value === formData.priority)?.label}</p>
            </div>
          </div>
          {showPurpose && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Purpose</h3>
              <p className="mt-1">{formData.purpose}</p>
            </div>
          )}
          {file && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Attachment</h3>
              <p className="mt-1">{file.name}</p>
            </div>
          )}
        </div>
      </SimpleModal>
    </div>
  );
};

export default NewRequest; 