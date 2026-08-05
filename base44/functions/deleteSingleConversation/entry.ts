import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Permanently deletes a single archived conversation (one room + all its
// messages), initiated by a participant from the Archived tab.
//
// Safety contract (kept separate from deleteLinkedConversations, which is for
// item-deletion cascades only):
//  1. Authenticate the caller.
//  2. Look up the room ourselves (service role) — never trust a caller-supplied
//     room object.
//  3. Verify the caller is a participant of the room.
//  4. Verify the room is archived (only archived rooms can be permanently
//     deleted this way — active rooms must be archived first).
//  5. Service-role delete all messages for that room, then the room itself,
//     bypassing ChatMessage delete-RLS so every participant's messages are
//     removed.
//  6. Fail loudly — errors are logged and surfaced as a 500, never swallowed.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch (_e) { body = {}; }
    const { roomId } = body || {};
    if (!roomId) {
      return Response.json({ error: 'roomId is required' }, { status: 400 });
    }

    const room = await base44.asServiceRole.entities.ChatRoom.get(roomId);
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });

    const participants = room.participant_ids || [];
    if (!participants.includes(user.id)) {
      return Response.json({ error: 'You are not a participant of this conversation' }, { status: 403 });
    }
    if (!room.archived) {
      return Response.json(
        { error: 'Only archived conversations can be permanently deleted. Archive it first.', status: 'not_archived' },
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