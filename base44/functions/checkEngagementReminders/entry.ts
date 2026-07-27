import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Countdown reminders are anchored to the deploy date (not the creation/speaking date).
const WINDOWS = [
  { label: '14 Days', minutes: 20160, minMinutes: 10080 },
  { label: '7 Days', minutes: 10080, minMinutes: 4320 },
  { label: '3 Days', minutes: 4320, minMinutes: 1440 },
  { label: '1 Day', minutes: 1440, minMinutes: 0 },
];

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function getMinutesUntilDeploy(engagement, now) {
  const dateStr = engagement.deploy_date;
  if (!dateStr) return null;
  const tz = engagement.timezone || 'UTC';
  const [y, mo, d] = dateStr.split('-').map(Number);
  // Deploy date is a calendar day; anchor to the start of that day in the engagement timezone
  const guess = Date.UTC(y, mo - 1, d, 0, 0);
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
  const realUTC = 2 * guess - tzAsUTC;
  return (realUTC - now.getTime()) / 60000;
}

function buildEmailBody(eng, windowLabel, tzLabel) {
  const dateStr = eng.deploy_date || eng.speaking_date || eng.start_date || 'TBD';
  const timeStr = eng.start_time || 'TBD';
  const addr = eng.address || 'TBD';
  const title = escapeHtml(eng.title);
  const speaker = escapeHtml(eng.speaker_name || 'TBD');
  const location = escapeHtml(addr);
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B">
    <h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B;margin-bottom:16px">Engagement Reminder</h2>
    <p style="font-size:16px">Your engagement <strong>${title}</strong> is coming up in <strong style="color:#D9A404">${windowLabel}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:6px 0;color:#5A6781;width:100px">Title</td><td style="padding:6px 0;font-weight:600">${title}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Speaker</td><td style="padding:6px 0">${speaker}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Date</td><td style="padding:6px 0">${dateStr}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Time</td><td style="padding:6px 0">${timeStr} ${tzLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#5A6781">Location</td><td style="padding:6px 0">${location}</td></tr>
    </table>
    <p style="font-size:13px;color:#5A6781;margin-top:20px">Please review the engagement details in the Engagement Log app.</p>
  </div>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authorize: either a valid admin session (direct call) or the cron
    // secret (scheduled workflow). The platform scheduler has no user
    // context, so without the secret it is indistinguishable from anonymous
    // HTTP and must be rejected.
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

    // Load engagements (sorted by most recent deploy date)
    const engagements = await base44.asServiceRole.entities.Engagement.list('-deploy_date', 500);

    // Load existing notifications to deduplicate
    const existing = await base44.asServiceRole.entities.Notification.list('-created_date', 500);
    const sentKeys = new Set(existing.map(n => `${n.engagement_id}:${n.window_label}`));

    // Load registered users for email reminders
    const users = await base44.asServiceRole.entities.User.list();

    const results = [];

    for (const eng of engagements) {
      const deployMinutes = getMinutesUntilDeploy(eng, now);

      // --- Deploy date reminder ---
    // When the deploy date is reached (today or just passed), remind to update progress.
    const deployKey = `${eng.id}:Deploy Date`;
    if (!sentKeys.has(deployKey) && eng.deploy_date) {
      // Trigger once deploy date has arrived (<= 0 minutes until) and within 7 days after
      if (deployMinutes !== null && deployMinutes <= 0 && deployMinutes > -10080) {
        const notif = await base44.asServiceRole.entities.Notification.create({
          engagement_id: eng.id,
          engagement_title: eng.title || eng.place || 'Engagement',
          speaking_date: eng.deploy_date,
          speaking_time: eng.start_time,
          timezone: eng.timezone,
          window_label: 'Deploy Date',
          email_sent: false,
          read: false,
        });
        sentKeys.add(deployKey);

        const tzLabel = eng.timezone || 'UTC';
        const titleOrPlace = escapeHtml(eng.title || eng.place || 'Engagement');
        const subject = `Action needed: Update progress for "${titleOrPlace}" — Deploy date reached`;
        const body = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B">
          <h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B;margin-bottom:16px">Deploy Date Reached</h2>
          <p style="font-size:16px">The deploy date for <strong>${escapeHtml(eng.title || eng.place || 'this engagement')}</strong> has arrived.</p>
          <p style="font-size:14px;color:#5A6781;margin-top:12px">Current progress: <strong>${escapeHtml(eng.progress || 'Not Started')}</strong></p>
          <p style="font-size:15px;margin-top:12px">Please update the <strong>Progress</strong> field to reflect the appropriate status (e.g. Ready to Deploy or Deploying).</p>
          <p style="font-size:13px;color:#5A6781;margin-top:20px">Review this engagement in the Engagement Log app.</p>
        </div>`;

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

        await base44.asServiceRole.entities.Notification.update(notif.id, { email_sent: emailSent });
        results.push({ engagement: eng.title, window: 'Deploy Date', emailSent });
      }
    }

    // Countdown reminders fire relative to the deploy date
    if (deployMinutes === null || deployMinutes <= 0) continue;
    for (const w of WINDOWS) {
        const key = `${eng.id}:${w.label}`;
        if (sentKeys.has(key)) continue;

        if (deployMinutes <= w.minutes && deployMinutes > w.minMinutes) {
          // Create in-app notification
          const notif = await base44.asServiceRole.entities.Notification.create({
            engagement_id: eng.id,
            engagement_title: eng.title,
            speaking_date: eng.deploy_date || eng.speaking_date || eng.start_date,
            speaking_time: eng.start_time,
            timezone: eng.timezone,
            window_label: w.label,
            email_sent: false,
            read: false,
          });
          sentKeys.add(key);

          // Send email to all registered users
          const tzLabel = eng.timezone || 'UTC';
          const subject = `Reminder: "${escapeHtml(eng.title)}" — ${w.label}`;
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