import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Reminders are time-of-day alerts. Meditation reminders are daily (anchored to
// the DailyReflection date); weekly goal reminders fire on the week's start
// date. In the no-account model this runs across ALL workspaces and writes
// workspace-scoped, in-app-only Notification records (no email). Each fires
// once: dedup keys on (window_label:speaking_date) per workspace.

// Resolve a (dateStr + HH:MM) in a given IANA timezone to a UTC ms instant.
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
    const workspaces = await base44.asServiceRole.entities.Workspace.list();
    const results = [];

    for (const ws of workspaces) {
      const wid = ws.workspace_id;

      // Build dedup keys from existing reflection/goal notifications in this workspace.
      const existing = await base44.asServiceRole.entities.Notification.filter({ workspace_id: wid }, '-created_date', 500);
      const sentKeys = new Set(
        existing
          .filter((n) => n.window_label === 'Meditation' || n.window_label === 'Goal')
          .map((n) => `${n.window_label}:${n.speaking_date || ''}`)
      );

      // --- Daily meditation reminders ---
      const reflections = await base44.asServiceRole.entities.DailyReflection.filter({ workspace_id: wid }, '-created_date', 500);
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
          await base44.asServiceRole.entities.Notification.create({
            engagement_title: 'Meditation time',
            speaking_date: r.date,
            speaking_time: r.meditation_reminder_time,
            timezone: tz,
            window_label: 'Meditation',
            workspace_id: wid,
            email_sent: false,
            read: false,
          });
          sentKeys.add(key);
          results.push({ workspace: wid, type: 'meditation', date: r.date });
        }
      }

      // --- Weekly goal review reminders (fire on the week's start date) ---
      const goals = await base44.asServiceRole.entities.WeeklyGoal.filter({ workspace_id: wid }, '-created_date', 500);
      for (const g of goals) {
        const tz = g.reminder_timezone || 'UTC';
        const goalList = Array.isArray(g.goals) ? g.goals : [];

        // General weekly review reminder (fires once on the week's start date).
        if (g.goal_reminder_time && g.start_date) {
          const due = dueUTC(g.start_date, g.goal_reminder_time, tz);
          if (due !== null) {
            const diffMin = (now.getTime() - due) / 60000;
            const key = `Goal:${g.start_date}`;
            if (!sentKeys.has(key) && diffMin >= 0 && diffMin < 60) {
              await base44.asServiceRole.entities.Notification.create({
                engagement_title: 'Review weekly goals',
                speaking_date: g.start_date,
                speaking_time: g.goal_reminder_time,
                timezone: tz,
                window_label: 'Goal',
                workspace_id: wid,
                email_sent: false,
                read: false,
              });
              sentKeys.add(key);
              results.push({ workspace: wid, type: 'goal', date: g.start_date });
            }
          }
        }

        // Per-goal daily reminders: each goal with a reminder_time fires once per
        // day during its week (start_date + 0..6 days). Dedup per goal+day.
        if (!g.start_date) continue;
        const [sy, sm, sd] = g.start_date.split('-').map(Number);
        for (let i = 0; i < 7; i++) {
          const day = new Date(Date.UTC(sy, sm - 1, sd + i));
          const dayStr = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`;
          for (const goal of goalList) {
            if (!goal.reminder_time || !goal.id) continue;
            const due = dueUTC(dayStr, goal.reminder_time, tz);
            if (due === null) continue;
            const diffMin = (now.getTime() - due) / 60000;
            const key = `GoalDaily:${goal.id}:${dayStr}`;
            if (sentKeys.has(key)) continue;
            if (diffMin >= 0 && diffMin < 60) {
              await base44.asServiceRole.entities.Notification.create({
                engagement_title: `Goal: ${goal.text || 'Daily goal reminder'}`,
                speaking_date: dayStr,
                speaking_time: goal.reminder_time,
                timezone: tz,
                window_label: 'Goal',
                workspace_id: wid,
                email_sent: false,
                read: false,
              });
              sentKeys.add(key);
              results.push({ workspace: wid, type: 'goal_daily', goalId: goal.id, date: dayStr });
            }
          }
        }
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});