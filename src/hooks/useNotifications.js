import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const items = await base44.entities.Notification.list('-created_date', 50);
      setNotifications(items.filter(n => !n.dismissed));
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

  const keepForReview = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await base44.entities.Notification.update(id, { read: true });
  }, []);

  const dismissNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await base44.entities.Notification.update(id, { dismissed: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await base44.entities.Notification.updateMany({ read: false }, { $set: { read: true } });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, keepForReview, dismissNotification, markAllAsRead, unreadCount };
}