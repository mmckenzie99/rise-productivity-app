import { base44 } from '@/api/base44Client';

// Cascade-deletes the conversations (rooms + messages) linked to a deleted
// engagement, trip, or plan. Delegates to the deleteLinkedConversations backend
// function, which runs as service role and:
//   • verifies the linked item is already gone (refuses if it still exists),
//   • looks up the linked rooms itself (never trusts caller-supplied ids),
//   • removes every participant's messages, bypassing ChatMessage delete-RLS.
// Throws on failure so the caller surfaces it — never silently leaves orphans.
// Permanently deletes one archived conversation (room + all its messages),
// initiated by a participant from the Archived tab. Delegates to the
// deleteSingleConversation backend function, which verifies the caller is a
// participant and that the room is archived before service-role deleting it
// and its messages. Throws on failure so the caller can surface it.
export async function deleteSingleConversation(roomId) {
  if (!roomId) return;
  const res = await base44.functions.invoke('deleteSingleConversation', { roomId });
  if (res?.data?.error) throw new Error(res.data.error);
}

// Per-person archive / unarchive via the toggleChatArchive backend function
// (service role). The caller's id is added/removed from archived_by only —
// other participants' views are unaffected. Returns the updated room record.
export async function archiveChatRoom(roomId) {
  if (!roomId) return;
  const res = await base44.functions.invoke('toggleChatArchive', { roomId, action: 'archive' });
  if (res?.data?.error) throw new Error(res.data.error);
  return res?.data?.room;
}

export async function unarchiveChatRoom(roomId) {
  if (!roomId) return;
  const res = await base44.functions.invoke('toggleChatArchive', { roomId, action: 'unarchive' });
  if (res?.data?.error) throw new Error(res.data.error);
  return res?.data?.room;
}

export async function deleteLinkedConversations(linkedId, linkType) {
  if (!linkedId || !linkType) return;
  const res = await base44.functions.invoke('deleteLinkedConversations', { linkedId, linkType });
  if (res?.data?.error) throw new Error(res.data.error);
}