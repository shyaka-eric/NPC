import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../api';
import type { NotificationModel } from '../models/notification.model';

const fetchNotifications = async (userId: string) => {
  const { data } = await api.get<NotificationModel[]>('notifications/', { params: { user: userId } });
  return data.map(n => ({ ...n, created_at: new Date(n.created_at).toISOString() }));
};

const markRead = async ({ id }: { id: string }) => {
  await api.patch(`notifications/${id}/mark_as_read/`);
};

const markAllRead = async (userId: string) => {
  await api.post('notifications/mark_all_as_read/');
};

export function useNotifications(userId: string) {
  const qc = useQueryClient();

  const query = useQuery(['notifications', userId], () => fetchNotifications(userId), {
    staleTime: 30 * 1000,
    onError: err => console.error('Fetch failed', err),
  });

  const markAsRead = useMutation(markRead, {
    onMutate: async ({ id }) => {
      await qc.cancelQueries(['notifications', userId]);
      const previous = qc.getQueryData<NotificationModel[]>(['notifications', userId]);
      qc.setQueryData<NotificationModel[]>(['notifications', userId], old =>
        old?.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      return { previous };
    },
    onError: (err, variables, context: any) => {
      qc.setQueryData(['notifications', userId], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries(['notifications', userId]);
    },
  });

  const markAllAsRead = useMutation(() => markAllRead(userId), {
    onMutate: async () => {
      await qc.cancelQueries(['notifications', userId]);
      const previous = qc.getQueryData<NotificationModel[]>(['notifications', userId]);
      qc.setQueryData<NotificationModel[]>(['notifications', userId], old =>
        old?.map(n => ({ ...n, is_read: true }))
      );
      return { previous };
    },
    onError: (err, variables, context: any) => {
      qc.setQueryData(['notifications', userId], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries(['notifications', userId]);
    },
  });

  return {
    ...query,
    markAsRead: (id: string) => markAsRead.mutate({ id }),
    markAllAsRead: () => markAllAsRead.mutate(),
    unreadCount: query.data?.filter(n => !n.is_read).length ?? 0,
  };
}
