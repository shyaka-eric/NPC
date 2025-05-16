import { api } from '../api';

export const fetchRepairRequests = async () => {
    const response = await api.get('/repair-requests/');
    return response.data;
};