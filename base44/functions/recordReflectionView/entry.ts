import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Stamps the "last reviewed" audit fields on a DailyReflection record when the
// Owner opens someone else's reflection for oversight. This is the only
// sanctioned writer of last_viewed_by_admin_id / last_viewed_by_admin_name /
// last_viewed_at — the values are taken from the server-verified auth context,
// never from the client payload, exactly like started_by_id in createChatRoom.
//
// Overwrites with the most recent reviewer only (not an accumulating history),
// matching the quiet, passive transparency design.
//
// Owner-only: a non-Owner admin gets 403, so oversight is restricted to the
// app Owner — matching the pattern chosen for chat room oversight.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!user.is_owner) return Response.json({ error: 'Only the Owner may review reflections' }, { status: 403 });

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const { reflectionId } = body || {};
    if (!reflectionId) return Response.json({ error: 'reflectionId is required' }, { status: 400 });

    let reflection: any;
    try {
      reflection = await base44.asServiceRole.entities.DailyReflection.get(reflectionId);
    } catch {
      return Response.json({ error: 'Reflection not found' }, { status: 404 });
    }
    if (!reflection) return Response.json({ error: 'Reflection not found' }, { status: 404 });

    // Don't stamp when the Owner reads their own reflection — that's personal
    // use, not oversight.
    if (reflection.created_by_id === user.id) {
      return Response.json({ ok: true, stamped: false, reason: 'self' });
    }

    const stamp = {
      last_viewed_by_admin_id: user.id,
      last_viewed_by_admin_name: user.full_name || user.email,
      last_viewed_at: new Date().toISOString(),
    };
    await base44.asServiceRole.entities.DailyReflection.update(reflectionId, stamp);
    const updated = await base44.asServiceRole.entities.DailyReflection.get(reflectionId);

    return Response.json({ ok: true, stamped: true, reflection: updated });
  } catch (error: any) {
    console.error('recordReflectionView: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}