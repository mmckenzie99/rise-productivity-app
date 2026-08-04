import { base44 } from '@/api/base44Client';

// Cascade-deletes the conversations (rooms + messages) linked to a deleted
// engagement, trip, or plan. Delegates to the deleteLinkedConversations backend
// function, which runs as service role and:
//   • verifies the linked item is already gone (refuses if it still exists),
//   • looks up the linked rooms itself (never trusts caller-supplied ids),
//   • removes every participant's messages, bypassing ChatMessage delete-RLS.
// Throws on failure so the caller surfaces it — never silently leaves orphans.
export async function deleteLinkedConversations(linkedId, linkType) {
  if (!linkedId || !linkType) return;
  const res = await base44.functions.invoke('deleteLinkedConversations', { linkedId, linkType });
  if (res?.data?.error) throw new Error(res.data.error);
}