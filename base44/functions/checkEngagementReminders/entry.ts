import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const WINDOWS = [
  { label: '14 Days', minutes: 20160, minMinutes: 10080 },
  { label: '7 Days', minutes: 10080, minMinutes: 1440 },
  { label: '1 Day', minutes: 1440, minMinutes: 60 },
  { label: '60 Minutes', minutes: 60, minMinutes: 30 },
  { label: '30 Minutes', minutes: 30, minMinutes: 15 },
  { label: '15 Minutes', minutes: 15, minMinutes: 0 },
];

function getMinutesUntil(engagement, now) {
  const dateStr = engagement.speaking_date || engagement.start_date;
  if (!dateStr) return null;
  const tz = engagement.timezone || 'UTC';
  const [y, mo, d] = dateStr.split('-').map(Number);
  const timeStr = engagement.start_time || '00:00';
  const [h, mi] = timeStr.split(':').map(Number);
  // Treat local time as UTC for initial guess
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // See what this UTC instant looks like in the engagement's timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(new Date(guess));
  const p = {};
  parts.forEach(pt => { if (pt.type !== 'literal') p[pt.type] = pt.value; });
  const tzAsUTC = Date.UTC(
    +p.year, +p.month - 1, +p.day,
    +(p.hour === '24' ? '0' : p.hour), +p.minute
  );
  // Real UTC = 2 * guess - tzAsUTC (see derivation in comments)
  const realUTC = 2 * guess - tzAsUTC;
  return (realUTC - now.getTime()) / 60000;
}

function buildEmailBody(eng, windowLabel, tzLabel) {
  const dateStr = eng.speaking_date || eng.start_date || 'TBD';
  const timeStr = eng.start_time || 'TBD';
  const addr = eng.address || 'TBD';
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B">
    <h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B;margin-bottom:16px">Engagement Reminder</h2>
    <p style="font-size:16px">Your engagement <strong>${eng.title}</strong> is coming up in <strong style="color:#D9A404">${windowLabel}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:6px 0;color:#5A6781;width:100px">Title</td><td style="padding:6px 0;font-weight:600">${eng.title}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Speaker</td><td style="padding:6px 0">${eng.speaker_name || 'TBD'}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Date</td><td style="padding:6px 0">${dateStr}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Time</td><td style="padding:6px 0">${timeStr} ${tzLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Location</td><td style="padding:6px 0">${addr}</td></tr>
    </table>
    <p style="font-size:13px;color:#5A6781;margin-top:20px">Please review the engagement details in the Engagement Log app.</p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled calls (no user) or admin direct calls
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch (_e) {
      // Scheduled run — no user context
    }

    const now = new Date();

    // Load engagements (sorted by most recent speaking date)
    const engagements = await base44.asServiceRole.entities.Engagement.list('-speaking_date', 500);

    // Load existing notifications to deduplicate
    const existing = await base44.asServiceRole.entities.Notification.list('-created_date', 500);
    const sentKeys = new Set(existing.map(n => `${n.engagement_id}:${n.window_label}`));

    // Load registered users for email reminders
    const users = await base44.asServiceRole.entities.User.list();

    const results = [];

    for (const eng of engagements) {
      const minutesUntil = getMinutesUntil(eng, now);
      if (minutesUntil === null || minutesUntil <= 0) continue;

      for (const w of WINDOWS) {
        const key = `${eng.id}:${w.label}`;
        if (sentKeys.has(key)) continue;

        if (minutesUntil <= w.minutes && minutesUntil > w.minMinutes) {
          // Create in-app notification
          const notif = await base44.asServiceRole.entities.Notification.create({
            engagement_id: eng.id,
            engagement_title: eng.title,
            speaking_date: eng.speaking_date || eng.start_date,
            speaking_time: eng.start_time,
            timezone: eng.timezone,
            window_label: w.label,
            email_sent: false,
            read: false,
          });
          sentKeys.add(key);

          // Send email to all registered users
          const tzLabel = eng.timezone || 'UTC';
          const subject = `Reminder: "${eng.title}" — ${w.label}`;
          const body = buildEmailBody(eng, w.label, tzLabel);

          let emailSent = false;
          for (const u of users) {
            if (!u.email) continue;
            try {
              await base44.asServiceRole.integrations.Core.SendEmail({
                to: u.email,
                subject,
                body,
              });
              emailSent = true;
            } catch (_e) {
              // Continue to next user
            }
          }

          // Record whether email was delivered
          await base44.asServiceRole.entities.Notification.update(notif.id, { email_sent: emailSent });
          results.push({ engagement: eng.title, window: w.label, emailSent });
        }
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});