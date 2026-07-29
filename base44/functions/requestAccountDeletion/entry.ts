import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const reason = body && typeof body.reason === 'string' ? body.reason : '';

    // Fetch admin users with service role (regular users can't list other users)
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const recipients = (admins || []).filter((u) => u.email).map((u) => u.email);

    const userName = user.full_name || user.email || 'A user';
    const userEmail = user.email || '';
    const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const subject = `Account deletion request: ${userName}`;
    const reasonHtml = reason ? `<p style="font-size:14px"><strong>Reason:</strong> ${esc(reason)}</p>` : '';
    const bodyHtml = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B2A4B"><h2 style="font-family:Fraunces,Georgia,serif;color:#1B2A4B">Account deletion request</h2><p style="font-size:16px"><strong>${esc(userName)}</strong> has requested permanent deletion of their account.</p><p style="font-size:14px"><strong>Email:</strong> ${esc(userEmail)}</p>${reasonHtml}<p style="font-size:13px;color:#5A6781">Please process this request and remove the user's data. This action cannot be undone.</p></div>`;

    let sent = 0;
    for (const email of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body: bodyHtml });
        sent++;
      } catch {}
    }

    return Response.json({ ok: true, notified: sent, recipients: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}