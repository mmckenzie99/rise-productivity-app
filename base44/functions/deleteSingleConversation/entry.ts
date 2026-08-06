import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Permanently deletes a single conversation (room + all its messages) GLOBALLY
// — for every participant — initiated from a participant's Archived tab.
//
// Security contract (server-side source of truth, not just UI-hidden):
//  1. Authenticate the caller.
//  2. Look up the room (service role) — never trust caller-supplied data.
//  3. Verify the caller is the conversation INITIATOR (started_by_id) OR the app
//     Owner (is_owner). A participant who did not start the room cannot delete
//     it, even though they can read it. started_by_id is set by createChatRoom
//     to the authenticated caller's user.id; Owner status is read from
//     user.is_owner — no role-string comparisons.
//  4. Verify the room is archived BY THE DELETER — archived_by must include
//     the deleter's id. Only a room the deleter moved to their own Archived tab
//     can be permanently deleted (two-step "trash then empty trash" flow).
//  5. Service-role delete all messages for the room, then the room itself.
//  6. Fail loudly — errors logged and surfaced as 500, never swallowed.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const { roomId } = body || {};
    if (!roomId) return Response.json({ error: 'roomId is required' }, { status: 400 });

    let room: any;
    try {
      room = await base44.asServiceRole.entities.ChatRoom.get(roomId);
    } catch {
      return Response.json({ error: 'Room not found' }, { status: 404 });
    }
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });

    const callerIsInitiator = !!room.started_by_id && room.started_by_id === user.id;
    const callerIsOwner = !!user.is_owner;
    if (!callerIsInitiator && !callerIsOwner) {
      return Response.json(
        { error: 'Only the conversation initiator or the app Owner can delete this conversation' },
        { status: 403 }
      );
    }

    const archivedBy = Array.isArray(room.archived_by) ? room.archived_by : [];
    if (!archivedBy.includes(user.id)) {
      return Response.json(
        { error: 'Archive this conversation first — it must be in your Archived tab before you can permanently delete it.', status: 'not_archived' },
        { status: 409 }
      );
    }

    await base44.asServiceRole.entities.ChatMessage.deleteMany({ room_id: roomId });
    await base44.asServiceRole.entities.ChatRoom.delete(roomId);

    return Response.json({ deleted: { room: true, messages: true } });
  } catch (error: any) {
    console.error('deleteSingleConversation: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}