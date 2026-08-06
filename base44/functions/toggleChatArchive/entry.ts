import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Per-person archive / unarchive. Adds or removes the CALLER's id in the
// room's archived_by array using $addToSet / $pull, so each participant
// archives independently — one person archiving never hides the room for
// anyone else.
//
// Runs as the service role so the array write is authoritative. RLS cannot
// field-lock archived_by, so we deliberately do NOT expose a client
// ChatRoom.update path to it: this function is the only sanctioned writer,
// which prevents one participant from force-(un)archiving for another.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const { roomId, action } = body || {};
    if (!roomId) return Response.json({ error: 'roomId is required' }, { status: 400 });
    if (action !== 'archive' && action !== 'unarchive') {
      return Response.json({ error: 'action must be "archive" or "unarchive"' }, { status: 400 });
    }

    let room: any;
    try {
      room = await base44.asServiceRole.entities.ChatRoom.get(roomId);
    } catch {
      return Response.json({ error: 'Room not found' }, { status: 404 });
    }
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });
    const participants = room.participant_ids || [];
    if (!participants.includes(user.id)) {
      return Response.json({ error: 'You are not a participant of this conversation' }, { status: 403 });
    }

    const op = action === 'archive'
      ? { $addToSet: { archived_by: user.id } }
      : { $pull: { archived_by: user.id } };
    await base44.asServiceRole.entities.ChatRoom.updateMany({ id: roomId }, op);
    const updated = await base44.asServiceRole.entities.ChatRoom.get(roomId);

    return Response.json({ ok: true, room: updated });
  } catch (error: any) {
    console.error('toggleChatArchive: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}