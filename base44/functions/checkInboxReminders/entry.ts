import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Fires a bell notification for each InboxItem whose reminder_at has arrived
// but has not yet been surfaced. Mirrors the auth + dedup pattern of
// checkEngagementReminders: authorized by either the cron secret (scheduled
// workflow) or a valid admin session (direct call). Each item fires at most
// once — reminder_fired is flipped true after the notification is created.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let authorized = false;
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret) {
      try {
        const body = await req.json();
        if (body && body.secret === cronSecret) authorized = true;
      } catch (_e) { /* no JSON body */ }
    }
    if (!authorized) {
      try {
        const user = await base44.auth.me();
        if (user && user.role === 'admin') {
          authorized = true;
        } else {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch (_e) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    const items = await base44.asServiceRole.entities.InboxItem.list('-created_date', 500);
    const results = [];

    for (const item of items) {
      if (!item.reminder_at || item.reminder_fired) continue;
      const due = new Date(item.reminder_at);
      if (isNaN(due.getTime()) || due.getTime() > now.getTime()) continue;

      const preview = String(item.message_text || '').slice(0, 120);
      const title = item.sender ? `${item.sender}: ${preview}` : preview || 'Inbox reminder';
      const iso = due.toISOString();

      await base44.asServiceRole.entities.Notification.create({
        engagement_id: item.id,
        engagement_title: title,
        speaking_date: iso.slice(0, 10),
        speaking_time: iso.slice(11, 16),
        window_label: 'Inbox Reminder',
        recipient_id: item.created_by_id,
        email_sent: false,
        read: false,
      });
      await base44.asServiceRole.entities.InboxItem.update(item.id, { reminder_fired: true });
      results.push({ id: item.id, sender: item.sender });
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});