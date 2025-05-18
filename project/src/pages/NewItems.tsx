import React, { useEffect, useState } from 'react';
import { useRequestsStore } from '../store/requestsStore';
import { useItemsStore } from '../store/itemsStore';
import PageHeader from '../components/PageHeader';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import { toast } from 'sonner';
import SimpleModal from '../components/ui/SimpleModal';
import { fetchNewItemRequests } from '../services/api';

const NewItems = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { requests, setRequests } = useRequestsStore();
  const { items } = useItemsStore();

  useEffect(() => {
    const loadRequests = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNewItemRequests();
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch new item requests:', error);
        toast.error('Failed to load new item requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();
  }, [setRequests]);

  // ... rest of the component code ...
}; 