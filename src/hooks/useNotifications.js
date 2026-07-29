import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const items = await base44.entities.Notification.list('-created_date', 50);
      setNotifications(items);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsub = base44.entities.Notification.subscribe(() => load());
    return unsub;
  }, [load]);

  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await base44.entities.Notification.delete(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    setNotifications(prev => prev.filter(n => n.read));
    await base44.entities.Notification.deleteMany({ read: false });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, markAsRead, markAllAsRead, unreadCount };
}