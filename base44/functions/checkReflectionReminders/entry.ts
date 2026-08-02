import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Reminders are time-of-day alerts. Meditation reminders are daily (anchored to
// the DailyReflection date); weekly goal reminders fire on the week's start date.
// Each fires once: dedup keys on (window_label:speaking_date) so a dismissed
// notification still blocks a duplicate the next run.

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Resolve a (dateStr + HH:MM) in a given IANA timezone to a UTC ms instant,
// using the same trick as the engagement reminder engine.
function dueUTC(dateStr, timeStr, tz) {
  if (!dateStr || !timeStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz || 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(guess));
  const p = {};
  parts.forEach((pt) => { if (pt.type !== 'literal') p[pt.type] = pt.value; });
  const tzAsUTC = Date.UTC(
    +p.year, +p.month - 1, +p.day,
    +(p.hour === '24' ? '0' : p.hour), +p.minute,
  );
  return 2 * guess - tzAsUTC;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authorize via the cron secret (scheduled workflow) or an admin session.
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
    const users = await base44.asServiceRole.entities.User.list();

    // Build dedup keys from existing reflection/goal notifications only.
    const existing = await base44.asServiceRole.entities.Notification.list('-created_date', 500);
    const sentKeys = new Set(
      existing
        .filter((n) => n.window_label === 'Meditation' || n.window_label === 'Goal')
        .map((n) => `${n.window_label}:${n.speaking_date || ''}`)
    );

    const results = [];

    // --- Daily meditation reminders ---
    const reflections = await base44.asServiceRole.entities.DailyReflection.list('-created_date', 500);
    for (const r of reflections) {
      if (!r.meditation_reminder_time || !r.date) continue;
      const tz = r.reminder_timezone || 'UTC';
      const due = dueUTC(r.date, r.meditation_reminder_time, tz);
      if (due === null) continue;
      const diffMin = (now.getTime() - due) / 60000;
      const key = `Meditation:${r.date}`;
      if (sentKeys.has(key)) continue;
      // Fire within an hour after the due time (5-min cron keeps this timely).
      if (diffMin >= 0 && diffMin < 60) {
        const notif = await base44.asServiceRole.entities.Notification.create({
          engagement_title: 'Meditation time',
          speaking_date: r.date,
          speaking_time: r.meditation_reminder_time,
          timezone: tz,
          window_label: 'Meditation',
          email_sent: false,
          read: false,
        });
        sentKeys.add(key);

        const subject = `Reminder: Meditation time — ${r.date}`;
        const meditationBlock = r.meditation
          ? `<blockquote style="border-left:3px solid #D9A404;padding-left:12px;margin:12px 0;color:#1B2A4B;font-size:15px">${escapeHtml(r.meditation)}</blockquote>`
          : '';
        const refBlock = r.meditation_reference
          ? `<p style="font-size:13px;color:#5A6781">${escapeHtml(r.meditation_reference)}</p>`
          : '';
        const body = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B">
          <h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B;margin-bottom:16px">Meditation Reminder</h2>
          <p style="font-size:16px">It's time for your daily meditation.</p>
          ${meditationBlock}${refBlock}
          <p style="font-size:13px;color:#5A6781;margin-top:20px">Open RISE to reflect and stay on track.</p>
        </div>`;

        let emailSent = false;
        for (const u of users) {
          if (!u.email) continue;
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({ to: u.email, subject, body });
            emailSent = true;
          } catch (_e) { /* continue */ }
        }
        await base44.asServiceRole.entities.Notification.update(notif.id, { email_sent: emailSent });
        results.push({ type: 'meditation', date: r.date, emailSent });
      }
    }

    // --- Weekly goal review reminders (fire on the week's start date) ---
    const goals = await base44.asServiceRole.entities.WeeklyGoal.list('-created_date', 500);
    for (const g of goals) {
      if (!g.goal_reminder_time || !g.start_date) continue;
      const tz = g.reminder_timezone || 'UTC';
      const due = dueUTC(g.start_date, g.goal_reminder_time, tz);
      if (due === null) continue;
      const diffMin = (now.getTime() - due) / 60000;
      const key = `Goal:${g.start_date}`;
      if (sentKeys.has(key)) continue;
      if (diffMin >= 0 && diffMin < 60) {
        const total = Array.isArray(g.goals) ? g.goals.length : 0;
        const pending = Array.isArray(g.goals) ? g.goals.filter((x) => !x.completed).length : 0;
        const notif = await base44.asServiceRole.entities.Notification.create({
          engagement_title: 'Review weekly goals',
          speaking_date: g.start_date,
          speaking_time: g.goal_reminder_time,
          timezone: tz,
          window_label: 'Goal',
          email_sent: false,
          read: false,
        });
        sentKeys.add(key);

        const subject = `Reminder: Review your weekly goals — ${g.start_date}`;
        const progressLine = total
          ? `<p style="font-size:14px;color:#5A6781">${pending} of ${total} goals still to complete this week.</p>`
          : `<p style="font-size:14px;color:#5A6781">You haven't set any goals yet this week.</p>`;
        const body = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B">
          <h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B;margin-bottom:16px">Weekly Goals Reminder</h2>
          <p style="font-size:16px">Time to review your goals for the week.</p>
          ${progressLine}
          <p style="font-size:13px;color:#5A6781;margin-top:20px">Open RISE to stay on track.</p>
        </div>`;

        let emailSent = false;
        for (const u of users) {
          if (!u.email) continue;
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({ to: u.email, subject, body });
            emailSent = true;
          } catch (_e) { /* continue */ }
        }
        await base44.asServiceRole.entities.Notification.update(notif.id, { email_sent: emailSent });
        results.push({ type: 'goal', date: g.start_date, emailSent });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});