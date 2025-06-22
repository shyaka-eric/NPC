import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Download, Trash, Pencil } from 'lucide-react';
import { useItemsStore } from '../store/itemsStore';
import { useAuthStore } from '../store/authStore';
import { Item } from '../types';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import StockForm from '../components/StockForm';
import { formatDate } from '../utils/formatters';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Pagination from '../components/Pagination';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SimpleModal from '../components/ui/SimpleModal';
import Textarea from '../components/ui/Textarea';

const STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'under_repair', label: 'Under Repair' },
];

const StockManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { items, fetchItems, deleteItem, addItem, updateItem } = useItemsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  // Filter out deleted items
  const visibleItems = items.filter(item => item.status !== 'deleted');
  const totalPages = Math.ceil(visibleItems.length / ITEMS_PER_PAGE);
  const paginatedItems = visibleItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const navigate = useNavigate();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expirationDate: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    expirationDate: '',
  });

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      try {
        await fetchItems();
      } catch (error) {
        console.error('Failed to fetch items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [fetchItems]);

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const parseExcelDate = (value: any): Date | undefined => {
    if (!value || value === 'N/A') return undefined;
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d;
    }
    return undefined;
  };

  const onExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet);
      if (json.length > 0) {
        console.log('Parsed headers:', Object.keys(json[0]));
      }
      let added = 0;
      for (const row of json) {
        // Normalize keys for flexible header matching
        const keys = Object.keys(row).reduce((acc, key) => {
          acc[key.trim().toLowerCase().replace(/\s+/g, '')] = row[key];
          return acc;
        }, {} as Record<string, any>);
        // Accept various header forms
        const name = keys['itemname'] || keys['name'] || '';
        const category = keys['category'] || '';
        const quantity = keys['quantity'] || '';
        const expirationDate = keys['expirationdate'] || '';
        if (!name) continue;
        try {
          await addItem({
            name,
            category,
            quantity: Number(quantity) || 0,
            expirationDate: expirationDate ? parseExcelDate(expirationDate)?.toISOString().split('T')[0] : '',
            status: 'in-stock',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          added++;
        } catch {}
      }
      toast.success(`${added} items imported successfully`);
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    const exportData = items.map(item => ({
      'Name': item.name,
      'Category': item.category,
      'Quantity': item.quantity,
      'Expiration Date': item.expirationDate ? formatDate(item.expirationDate) : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'stock.xlsx');
  };

  const handleExportTemplate = () => {
    const templateData = [{
      'Name': '',
      'Category': '',
      'Quantity': '',
      'Expiration Date': '',
    }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, 'stock_import_template.xlsx');
  };

  const handleDeleteItem = (itemId: string) => {
    setDeleteTargetId(itemId);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!deleteTargetId || !deleteReason.trim()) return;
    setDeletingItemId(deleteTargetId);
    try {
      await deleteItem(deleteTargetId, deleteReason); // Pass reason to backend
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete item');
    } finally {
      setDeletingItemId(null);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setDeleteReason('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addItem({
        ...formData,
        quantity: parseInt(formData.quantity),
        expiration_date: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
        status: 'in-stock',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        category: '',
        quantity: '',
        expirationDate: '',
      });
      toast.success('Item added successfully');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await updateItem(selectedItem.id, {
        ...editFormData,
        quantity: parseInt(editFormData.quantity),
        expiration_date: editFormData.expirationDate ? editFormData.expirationDate : undefined, // send as 'YYYY-MM-DD'
        updatedAt: new Date(),
      });
      setIsEditModalOpen(false);
      toast.success('Item updated successfully');
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  useEffect(() => {
    if (selectedItem) {
      setEditFormData({
        name: selectedItem.name,
        category: selectedItem.category,
        quantity: selectedItem.quantity.toString(),
        expirationDate: selectedItem.expiration_date ? selectedItem.expiration_date.toISOString().split('T')[0] : '',
      });
    }
  }, [selectedItem]);

  const columns = [
    { header: 'Item Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Expiration Date', accessor: (item: Item) => item.expiration_date ? formatDate(item.expiration_date) : '-' },
    { header: 'Last Updated', accessor: (item: Item) => formatDate(item.last_updated) },
    { header: 'Actions', accessor: (item: Item) => (
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" size="sm" icon={<Pencil className="h-4 w-4" />} onClick={e => { e.stopPropagation(); handleEditItem(item); }}>Edit</Button>
        <Button type="button" variant="danger" size="sm" icon={<Trash className="h-4 w-4" />} onClick={e => { e.stopPropagation(); handleDeleteItem(item.id); }} isLoading={deletingItemId === item.id}>Delete</Button>
      </div>
    ), className: 'text-right' }
  ];

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
      {/* Hidden file input for Excel import */}
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={onExcelFileChange}
      />
      <PageHeader
        title="Stock Management"
        description="Manage your inventory and stock levels"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleImportExcel}
              className="mr-2"
            >
              <Upload className="w-4 h-4 mr-1" /> Upload Excel
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportTemplate}
              className="mr-2"
            >
              <Download className="w-4 h-4 mr-1" /> Download Template
            </Button>
            <Button
              onClick={() => navigate('/add-stock')}
              icon={<Plus className="h-4 w-4" />}
            >
              Add New Item
            </Button>
          </div>
        }
      />

      <div className="mt-8 flex-1">
        <Table
          columns={columns}
          data={paginatedItems}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      </div>

      <SimpleModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Stock Item"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={<Plus className="h-4 w-4" />}
              form="add-stock-form"
            >
              Add Item
            </Button>
          </div>
        }
      >
        <form id="add-stock-form" onSubmit={handleSubmit} className="space-y-4">
          <Input label="Item Name" name="name" value={formData.name} onChange={handleChange} required />
          <Input label="Category" name="category" value={formData.category} onChange={handleChange} required />
          <Input label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
          <Input label="Expiration Date" name="expirationDate" type="date" value={formData.expirationDate} onChange={handleChange} />
        </form>
      </SimpleModal>

      <SimpleModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Stock Item"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={<Pencil className="h-4 w-4" />}
              form="edit-stock-form"
            >
              Update Item
            </Button>
          </div>
        }
      >
        {selectedItem && (
          <form id="edit-stock-form" onSubmit={handleEditSubmit} className="space-y-4">
            <Input label="Item Name" name="name" value={editFormData.name} onChange={handleEditChange} required />
            <Input label="Category" name="category" value={editFormData.category} onChange={handleEditChange} required />
            <Input label="Quantity" name="quantity" type="number" value={editFormData.quantity} onChange={handleEditChange} required />
            <Input label="Expiration Date" name="expirationDate" type="date" value={editFormData.expirationDate} onChange={handleEditChange} />
          </form>
        )}
      </SimpleModal>

      {showDeleteModal && (
        <SimpleModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Item"
          footer={
            <>
              <Button
                variant="danger"
                onClick={confirmDeleteItem}
                disabled={!deleteReason.trim() || deletingItemId === deleteTargetId}
                isLoading={deletingItemId === deleteTargetId}
              >
                Confirm Delete
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deletingItemId === deleteTargetId}>Cancel</Button>
            </>
          }
        >
          <Textarea
            label="Reason for Deletion"
            value={deleteReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeleteReason(e.target.value)}
            required
            minRows={3}
            maxRows={6}
            placeholder="Enter reason..."
            autoFocus
          />
        </SimpleModal>
      )}
    </div>
  );
};

export default StockManagement;