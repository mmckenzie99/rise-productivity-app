import { base44 } from '@/api/base44Client';

// Permanently delete every conversation (room + its messages) linked to a given
// engagement, trip, or plan. Called when the linked item itself is deleted so no
// orphaned chats remain. Runs as the acting user (RLS-respecting): admins — the
// only deleters of engagements/trips — can remove any room; plan deleters can
// remove rooms they own.
export async function deleteLinkedConversations(linkedId) {
  if (!linkedId) return;
  try {
    const rooms = await base44.entities.ChatRoom.filter({ linked_id: linkedId });
    const ids = (rooms || []).map((r) => r.id);
    if (!ids.length) return;
    try { await base44.entities.ChatMessage.deleteMany({ room_id: { $in: ids } }); } catch {}
    try { await base44.entities.ChatRoom.deleteMany({ linked_id: linkedId }); } catch {}
  } catch {}
}