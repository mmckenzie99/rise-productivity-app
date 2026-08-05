import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Server-side chat room creation. All direct client ChatRoom.create is blocked
// by RLS (the create rule matches no user); this function is the ONLY sanctioned
// path. It:
//   1. Authenticates the caller.
//   2. Checks can_start_chats: Owner bypass → explicit per-user override → role
//      default from AppSettings (mirrors src/lib/permissions.js resolveFeature).
//   3. Validates participant IDs: non-empty, includes the caller, AND every id
//      is a real user in this app (checked against the service-role roster).
//      participant_ids drives ChatMessage read-RLS, so we never trust
//      caller-supplied ids — a crafted call must not seed a room with garbage.
//   4. Validates the linked item (engagement/trip/plan) exists when provided.
//   5. Creates the room as the service role (bypasses the locked create-RLS).
//
// Backstop dedup: for a direct 2-person room, if an active direct room with
// exactly those two participants already exists, return it instead of a dup.
// The client also dedups against its in-memory list; this guards a crafted or
// raced call.
function resolveCanStartChats(user: any, settings: any): boolean {
  if (user?.is_owner) return true;
  const v = user?.can_start_chats;
  if (v === true) return true;
  if (v === false) return false;
  const role = user?.role || 'user';
  return settings?.features?.can_start_chats?.[role] === true;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const { participantIds, linkType = 'none', linkedId, title, topic } = body || {};

    // Shape validation
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return Response.json({ error: 'participantIds must be a non-empty array' }, { status: 400 });
    }
    const ids: string[] = Array.from(new Set((participantIds as any[]).map(String)));
    if (!ids.includes(user.id)) {
      return Response.json({ error: 'Caller must be a participant' }, { status: 400 });
    }
    const validLinkTypes = ['none', 'engagement', 'trip', 'plan'];
    if (!validLinkTypes.includes(linkType)) {
      return Response.json({ error: 'Invalid linkType' }, { status: 400 });
    }
    if (linkType !== 'none' && !linkedId) {
      return Response.json({ error: 'linkedId is required for linked rooms' }, { status: 400 });
    }

    // Permission check (server-side source of truth)
    const settingsList = await base44.asServiceRole.entities.AppSettings.list();
    const settings: any = (settingsList && settingsList[0]) || { features: {} };
    if (!resolveCanStartChats(user, settings)) {
      return Response.json({ error: 'You do not have permission to start conversations' }, { status: 403 });
    }

    // Validate every participant id against the real roster.
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = new Map<string, any>((allUsers || []).map((u: any) => [u.id, u]));
    const invalid = ids.filter((id) => !userMap.has(id));
    if (invalid.length) {
      return Response.json({ error: `Unknown participant id(s): ${invalid.join(', ')}` }, { status: 400 });
    }
    const nameMap: Record<string, string> = {};
    for (const u of (allUsers || [])) nameMap[u.id] = u.full_name || u.email || 'Unknown';

    // Validate the linked item exists.
    let linked_title: string | undefined;
    let type = 'direct';
    if (linkType === 'engagement') {
      type = 'engagement';
      const eng = await base44.asServiceRole.entities.Engagement.get(linkedId);
      if (!eng) return Response.json({ error: 'Linked engagement not found' }, { status: 404 });
      linked_title = eng.title || eng.place || 'Engagement';
    } else if (linkType === 'trip') {
      type = 'trip';
      const trip = await base44.asServiceRole.entities.Trip.get(linkedId);
      if (!trip) return Response.json({ error: 'Linked trip not found' }, { status: 404 });
      linked_title = (Array.isArray(trip.place) ? trip.place.join(', ') : trip.place) || 'Trip';
    } else if (linkType === 'plan') {
      type = 'plan';
      const plan = await base44.asServiceRole.entities.CalendarEvent.get(linkedId);
      if (!plan) return Response.json({ error: 'Linked plan not found' }, { status: 404 });
      linked_title = plan.title || 'Plan';
    }

    // Resolve display title
    let resolvedTitle: string;
    if (linkType !== 'none') {
      resolvedTitle = linked_title as string;
    } else {
      const otherIds = ids.filter((id) => id !== user.id);
      resolvedTitle = (title && String(title).trim()) ||
        (otherIds.length === 1 ? (nameMap[otherIds[0]] || 'Unknown') : `Group · ${ids.length}`);
    }

    // Backstop dedup for direct 2-person rooms.
    if (linkType === 'none' && ids.length === 2) {
      const candidates = await base44.asServiceRole.entities.ChatRoom.filter({ type: 'direct' });
      const existing = (candidates || []).find((r: any) => {
        const p: string[] = r.participant_ids || [];
        return p.length === 2 && ids.every((id) => p.includes(id));
      });
      if (existing) return Response.json({ ok: true, room: existing, duplicate: true });
    }

    // started_by_id is the human initiator's id — set server-side from the
    // authenticated caller, never from the client payload. It is the
    // permanent-deletion authority (only this user or the Owner may delete).
    const room = await base44.asServiceRole.entities.ChatRoom.create({
      title: resolvedTitle,
      topic: (topic || '').trim(),
      type,
      participant_ids: ids,
      participant_names: ids.map((id) => nameMap[id] || 'Unknown'),
      linked_id: linkType !== 'none' ? linkedId : undefined,
      linked_title,
      started_by_id: user.id,
    });

    return Response.json({ ok: true, room });
  } catch (error: any) {
    console.error('createChatRoom: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}