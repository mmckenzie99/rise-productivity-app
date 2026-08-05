import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Notifies participants of a chat room about a new message.
//
//  • Creates a Notification record (recipient-targeted via recipient_id) for
//    every non-sender participant, UNCONDITIONALLY. The sender's device cannot
//    know the recipient's session state, so we always create the record; the
//    recipient's app clears it (marks read) when the conversation is opened or
//    when a new message arrives while it's open. This means an offline
//    recipient still sees the bell badge on their next app open.
//
//  • On the FIRST message in the room only, also sends an invitation email to
//    each non-sender participant (registered app users only). Subsequent
//    messages never email, to avoid spam. Email failures are logged via
//    console.error, never swallowed; missing recipient emails are warned.
//
// Safety: authenticates the caller and verifies they are a participant of the
// room before doing anything.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch (_e) { body = {}; }
    const { roomId, messageId } = body || {};
    if (!roomId || !messageId) {
      return Response.json({ error: 'roomId and messageId are required' }, { status: 400 });
    }

    const room = await base44.asServiceRole.entities.ChatRoom.get(roomId);
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 });
    const participants = room.participant_ids || [];
    if (!participants.includes(user.id)) {
      return Response.json({ error: 'Not a participant of this room' }, { status: 403 });
    }

    const recipients = participants.filter((id: string) => id !== user.id);
    const senderName = user.full_name || user.email || 'Someone';

    // Fetch the triggering message so the bell title can show a preview
    // (e.g. "Sarah: Test") and the email body can quote it.
    const msg = await base44.asServiceRole.entities.ChatMessage.get(messageId);
    const isFileOnly = !msg?.body && !!msg?.attachment;
    const titlePreview = isFileOnly ? `📎 ${msg.attachment.name}` : (msg?.body || '').slice(0, 100);
    const emailPreview = isFileOnly ? `📎 ${msg.attachment.name}` : (msg?.body || '').slice(0, 200);

    // (1) Create a recipient-targeted notification for each non-sender
    // participant. engagement_id holds the room id so the recipient's app can
    // find and clear these on open; engagement_title holds "Sender: preview"
    // so entries are distinguishable in the bell.
    for (const rid of recipients) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_id: rid,
          engagement_id: roomId,
          engagement_title: `${senderName}: ${titlePreview}`,
          window_label: 'New Message',
          read: false,
          email_sent: false,
        });
      } catch (e: any) {
        console.error('notifyChatMessage: notification create failed for', rid, e?.message || e);
      }
    }

    // (2) First-message invitation email only — never email per message.
    const msgs = await base44.asServiceRole.entities.ChatMessage.filter({ room_id: roomId }, null, 2);
    if ((msgs || []).length === 1) {
      const subject = isFileOnly ? `${senderName} shared a file with you` : `${senderName} started a conversation with you`;
      const esc = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const link = `https://rise-60-1.base44.app/chat/${roomId}`;
      const users = await base44.asServiceRole.entities.User.list();
      for (const rid of recipients) {
        const u = (users || []).find((x: any) => x.id === rid);
        if (!u?.email) {
          console.warn('notifyChatMessage: no email for recipient', rid);
          continue;
        }
        try {
          await base44.integrations.Core.SendEmail({
            to: u.email,
            subject,
            body: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B"><h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B">New Conversation</h2><p style="font-size:16px"><strong>${esc(senderName)}</strong> started a conversation with you:</p><p style="font-size:15px;padding:10px 14px;background:#F0F2F6;border-radius:8px">${esc(emailPreview)}</p><p style="margin-top:18px"><a href="${link}" style="display:inline-block;background:#D9A404;color:#1B2A4B;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:11px 22px;border-radius:8px">Open Conversation</a></p></div>`,
          });
        } catch (e: any) {
          console.error('notifyChatMessage: SendEmail failed for', rid, e?.message || e);
        }
      }
    }

    return Response.json({ ok: true, recipients: recipients.length });
  } catch (error: any) {
    console.error('notifyChatMessage: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}