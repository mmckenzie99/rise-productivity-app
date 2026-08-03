import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { getOpenChatRoom } from '@/lib/chatSession';

const mentionsUser = (body, user) => {
  if (!body) return false;
  const b = body.toLowerCase();
  const name = (user.full_name || '').trim();
  if (name && b.includes(name.toLowerCase())) return true;
  if (user.email && b.includes(user.email.toLowerCase())) return true;
  const first = name ? name.split(' ')[0] : '';
  if (first && b.includes('@' + first.toLowerCase())) return true;
  return false;
};

export default function useChatNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const roomMap = new Map();
    const refresh = async () => {
      try {
        const list = await base44.entities.ChatRoom.list('-last_message_at', 100);
        (list || []).forEach((r) => roomMap.set(r.id, r));
      } catch {
        /* ignore */
      }
    };
    refresh();

    const unsubRooms = base44.entities.ChatRoom.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') roomMap.set(event.data.id, event.data);
      else if (event.type === 'delete') roomMap.delete(event.data.id);
    });

    const unsubMsg = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== 'create') return;
      const m = event.data;
      if (!m || m.author_id === user.id) return;
      const room = roomMap.get(m.room_id);
      if (!room) return;
      if (m.room_id === getOpenChatRoom()) return;

      const isDM = room.type === 'direct' && (room.participant_ids || []).length === 2;
      const isTripMention = room.type === 'trip' && mentionsUser(m.body, user);
      if (!isDM && !isTripMention) return;

      const snippet = m.body && m.body.length > 120 ? `${m.body.slice(0, 120)}…` : m.body || '';
      toast({
        title: isTripMention
          ? `Mentioned in ${room.title}`
          : `New message from ${m.author_name || 'Someone'}`,
        description: snippet,
        duration: 5000,
      });
    });

    return () => {
      unsubRooms && unsubRooms();
      unsubMsg && unsubMsg();
    };
  }, [user?.id]);
}