import { data } from '@/lib/workspaceData';

// Sync the InboxItem "follow-up" flag for a source record. When flagged,
// create or update an InboxItem (is_important=true) so it appears in the
// Inbox. When unflagged, mark the existing InboxItem is_important=false.
// Mirrors the Faith journal's sermon-prep sync for Fitness and Engagement.
export async function syncFollowUpFlag(sourceType, sourceId, flagged, title, dateKey) {
  if (!sourceId) return;
  const existing = await data.entities.InboxItem.filter({ source_type: sourceType, source_id: sourceId });
  const ex = existing && existing[0];
  if (flagged) {
    const payload = {
      is_important: true,
      source_type: sourceType,
      source_id: sourceId,
      source_title: title || '',
      message_text: title || '',
      entity_type: 'None',
    };
    if (dateKey) payload.message_date = `${dateKey}T12:00:00.000Z`;
    if (ex) await data.entities.InboxItem.update(ex.id, payload);
    else await data.entities.InboxItem.create(payload);
  } else if (ex) {
    await data.entities.InboxItem.update(ex.id, { is_important: false });
  }
}