import { useEffect, useState, useCallback } from 'react';
import { data } from '@/lib/workspaceData';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const items = await data.entities.Notification.list('-created_date', 50);
      setNotifications(items.filter((n) => !n.dismissed));
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = data.entities.Notification.subscribe(() => load());
    return unsub;
  }, [load]);

  const keepForReview = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await data.entities.Notification.update(id, { read: true });
  }, []);

  const dismissNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await data.entities.Notification.update(id, { dismissed: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await Promise.all(unread.map((n) => data.entities.Notification.update(n.id, { read: true })));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, keepForReview, dismissNotification, markAllAsRead, unreadCount };
}