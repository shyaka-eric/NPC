import { api } from '../api';

export const fetchDeletedItems = async () => {
  const response = await api.get('items/deleted/');
  return response.data;
};
