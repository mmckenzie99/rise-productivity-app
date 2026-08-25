import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Countdown reminders are anchored to the deploy date (not the creation/speaking date).
// In the no-account model this runs across ALL workspaces and writes
// workspace-scoped, in-app-only Notification records (no email). Each
// notification is stamped with workspace_id so the bell (which filters by
// workspace_id) surfaces it only to members of that workspace.
const WINDOWS = [
  { label: '14 Days', minutes: 20160, minMinutes: 10080 },
  { label: '7 Days', minutes: 10080, minMinutes: 4320 },
  { label: '3 Days', minutes: 4320, minMinutes: 1440 },
  { label: '1 Day', minutes: 1440, minMinutes: 0 },
];

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authorize: either the cron secret (scheduled workflow) or an admin
    // session (direct call). The platform scheduler has no user context.
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

      const engagements = await base44.asServiceRole.entities.Engagement.filter({ workspace_id: wid }, '-deploy_date', 500);

      // Dedup per workspace: dismissed records are kept so they still block a
      // window from re-firing; other windows still fire when their time comes.
      const existing = await base44.asServiceRole.entities.Notification.filter({ workspace_id: wid }, '-created_date', 500);
      const sentKeys = new Set(existing.map(n => `${n.engagement_id}:${n.window_label}`));

      for (const eng of engagements) {
        const deployMinutes = getMinutesUntilDeploy(eng, now);

        // --- Deploy date reminder (progress nudge once the deploy date arrives) ---
        const deployKey = `${eng.id}:Deploy Date`;
        if (!sentKeys.has(deployKey) && eng.deploy_date) {
          if (deployMinutes !== null && deployMinutes <= 0 && deployMinutes > -10080) {
            await base44.asServiceRole.entities.Notification.create({
              engagement_id: eng.id,
              engagement_title: eng.title || eng.place || 'Engagement',
              speaking_date: eng.deploy_date,
              speaking_time: eng.start_time,
              timezone: eng.timezone,
              window_label: 'Deploy Date',
              workspace_id: wid,
              email_sent: false,
              read: false,
            });
            sentKeys.add(deployKey);
            results.push({ workspace: wid, engagement: eng.title, window: 'Deploy Date' });
          }
        }

        // Countdown reminders fire relative to the deploy date
        if (deployMinutes === null || deployMinutes <= 0) continue;
        for (const w of WINDOWS) {
          const key = `${eng.id}:${w.label}`;
          if (sentKeys.has(key)) continue;
          if (deployMinutes <= w.minutes && deployMinutes > w.minMinutes) {
            await base44.asServiceRole.entities.Notification.create({
              engagement_id: eng.id,
              engagement_title: eng.title,
              speaking_date: eng.deploy_date || eng.speaking_date || eng.start_date,
              speaking_time: eng.start_time,
              timezone: eng.timezone,
              window_label: w.label,
              workspace_id: wid,
              email_sent: false,
              read: false,
            });
            sentKeys.add(key);
            results.push({ workspace: wid, engagement: eng.title, window: w.label });
          }
        }
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});