import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Cascade-deletes the conversations (rooms + messages) linked to a deleted
// engagement, trip, or plan. Called AFTER the frontend has deleted the item.
//
// Safety contract:
//  1. Verify before destroying — look up the linked item ourselves and confirm
//     it no longer exists. The caller must delete the engagement/trip/plan
//     FIRST. If it still exists, we refuse (409), so a malicious authenticated
//     user can't wipe a live item's chats by hitting this endpoint directly.
//  2. Look up the linked rooms ourselves (server-side) — never trust caller-
//     supplied room ids.
//  3. Run as service role so every participant's messages are removed, bypassing
//     the ChatMessage delete-RLS that would otherwise orphan other users'
//     messages when a non-admin deletes a plan.
//  4. Fail loudly — errors are logged and surfaced as a 500, never swallowed,
//     so orphaned data can't accumulate invisibly.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch (_e) { body = {}; }
    const { linkedId, linkType } = body || {};
    if (!linkedId || !linkType) {
      return Response.json({ error: 'linkedId and linkType are required' }, { status: 400 });
    }
    const entityName = linkType === 'engagement' ? 'Engagement'
      : linkType === 'trip' ? 'Trip'
      : linkType === 'plan' ? 'CalendarEvent'
      : null;
    if (!entityName) {
      return Response.json({ error: `Unknown linkType: ${linkType}` }, { status: 400 });
    }

    // (1) Verify the linked item is gone. If it still exists, refuse.
    const entities = base44.asServiceRole.entities as any;
    const existing = await entities[entityName].filter({ id: linkedId }, null, 1);
    if (existing && existing.length > 0) {
      return Response.json(
        { error: `Linked ${linkType} still exists; refusing to delete its conversations.`, status: 'still_exists' },
        { status: 409 }
      );
    }

    // (2) Look up the linked rooms ourselves (service role → all participants).
    const rooms = await base44.asServiceRole.entities.ChatRoom.filter({ linked_id: linkedId });
    const roomIds = (rooms || []).map((r: any) => r.id);
    if (roomIds.length === 0) {
      return Response.json({ deleted: { rooms: 0, messages: 0 } });
    }

    // (2b) Authorization — only an admin or an actual participant/initiator of
    // every linked room may cascade-delete these conversations. Stops a
    // non-participant from wiping other users' private chats by supplying a
    // linkedId whose owner entity is already gone.
    if (user.role !== 'admin') {
      const forbidden = (rooms || []).some((r: any) =>
        !(r.participant_ids || []).includes(user.id) && r.started_by_id !== user.id
      );
      if (forbidden) {
        return Response.json({ error: 'Forbidden: not a participant of all linked conversations' }, { status: 403 });
      }
    }

    // (4) Delete messages then rooms. Let errors throw to the outer catch —
    // never swallow, so failures are logged and surfaced.
    await base44.asServiceRole.entities.ChatMessage.deleteMany({ room_id: { $in: roomIds } });
    await base44.asServiceRole.entities.ChatRoom.deleteMany({ linked_id: linkedId });

    return Response.json({ deleted: { rooms: roomIds.length, messages: true } });
  } catch (error: any) {
    console.error('deleteLinkedConversations: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}