import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Adds a participant to an existing chat conversation.
//
// Validation: the caller must be a current participant of the room. The target
// user must exist and not already be in the room. participant_ids is only ever
// APPENDED — never removed or swapped — and only via the service role, so a
// regular client cannot shrink or replace the list.
//
// Atomicity: Base44 has no cross-entity transaction. We perform, in order:
//   1. Replace participant_ids/participant_names with old+new (the append).
//   2. Create a system-authored ChatMessage marking the audience change.
//   3. Create a Notification for the added user + send an invitation email.
// Fail-loud policy (no swallowed catches):
//   • Step 1 failure → 500 immediately, nothing changed.
//   • Step 2 or 3 failure → the participant IS added; we console.error every
//     failure and return 200 with { ok:false, added:true, errors:[...] } so the
//     client can refresh AND surface a loud alert about the audit/notify gap.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const { roomId, newUserId } = body || {};
    if (!roomId || !newUserId) {
      return Response.json({ error: 'roomId and newUserId are required' }, { status: 400 });
    }

    const room = await base44.asServiceRole.entities.ChatRoom.get(roomId);
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });
    const participants: string[] = room.participant_ids || [];
    if (!participants.includes(user.id)) {
      return Response.json({ error: 'Not a participant of this room' }, { status: 403 });
    }
    if (participants.includes(newUserId)) {
      return Response.json({ error: 'User is already a participant' }, { status: 409 });
    }

    const newUser = await base44.asServiceRole.entities.User.get(newUserId);
    if (!newUser) return Response.json({ error: 'User not found' }, { status: 404 });
    const newName = newUser.full_name || newUser.email || 'Someone';
    const adderName = user.full_name || user.email || 'Someone';
    const newParticipants = [...participants, newUserId];
    const newNames = [...(room.participant_names || []), newName];

    const errors: string[] = [];

    // (1) Append the participant (service role bypasses RLS; we only ever add).
    try {
      await base44.asServiceRole.entities.ChatRoom.update(roomId, {
        participant_ids: newParticipants,
        participant_names: newNames,
      });
    } catch (e: any) {
      console.error('addChatParticipant: participant push failed', e?.message || e);
      return Response.json({ error: `Failed to add participant: ${e?.message || e}` }, { status: 500 });
    }

    // (2) System message marking the audience change (server-side only).
    try {
      await base44.asServiceRole.entities.ChatMessage.create({
        room_id: roomId,
        body: `${adderName} added ${newName} to the conversation`,
        author_id: 'system',
        author_name: 'System',
        is_system: true,
        participant_ids: newParticipants,
      });
      await base44.asServiceRole.entities.ChatRoom.update(roomId, {
        last_message: `${adderName} added ${newName}`,
        last_message_at: new Date().toISOString(),
        last_sender_name: 'System',
      });
    } catch (e: any) {
      console.error('addChatParticipant: system message failed', e?.message || e);
      errors.push(`System message failed: ${e?.message || e}`);
    }

    // (3) Notify the added user: bell notification + invitation email.
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_id: newUserId,
        engagement_id: roomId,
        engagement_title: `${adderName} added you to ${room.title || 'a conversation'}`,
        window_label: 'New Message',
        read: false,
        email_sent: false,
      });
    } catch (e: any) {
      console.error('addChatParticipant: notification failed', e?.message || e);
      errors.push(`Notification failed: ${e?.message || e}`);
    }

    try {
      if (newUser.email) {
        const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const link = `https://rise-60-1.base44.app/chat/${roomId}`;
        await base44.integrations.Core.SendEmail({
          to: newUser.email,
          subject: `${adderName} added you to a conversation`,
          body: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B"><h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B">New Conversation</h2><p style="font-size:16px"><strong>${esc(adderName)}</strong> added you to <strong>${esc(room.title || 'a conversation')}</strong>.</p><p style="margin-top:18px"><a href="${link}" style="display:inline-block;background:#D9A404;color:#1B2A4B;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px">Open Conversation</a></p></div>`,
        });
      } else {
        console.warn('addChatParticipant: added user has no email, skipping invite', newUserId);
      }
    } catch (e: any) {
      console.error('addChatParticipant: SendEmail failed', e?.message || e);
      errors.push(`Email failed: ${e?.message || e}`);
    }

    if (errors.length) {
      return Response.json({ ok: false, added: true, errors }, { status: 200 });
    }
    return Response.json({ ok: true, added: true });
  } catch (error: any) {
    console.error('addChatParticipant: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}