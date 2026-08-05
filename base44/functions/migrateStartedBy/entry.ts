import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Idempotent backfill of ChatRoom.started_by_id for legacy rooms created before
// the field existed. All such rooms were created by a system service (their
// created_by_id is "service_…"), so the human initiator can't be recovered — we
// default started_by_id to the authenticated Owner's user id (or an explicit
// fallbackOwnerId). Rooms that already have a started_by_id are left untouched.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const fallbackOwnerId = body?.fallbackOwnerId || user.id;

    const rooms = await base44.asServiceRole.entities.ChatRoom.list('-created_date', 500);
    const assigned: any[] = [];
    const skipped: any[] = [];

    for (const r of (rooms || [])) {
      if (r.started_by_id) {
        skipped.push({ id: r.id, title: r.title, started_by_id: r.started_by_id });
        continue;
      }
      await base44.asServiceRole.entities.ChatRoom.update(r.id, { started_by_id: fallbackOwnerId });
      assigned.push({ id: r.id, title: r.title, started_by_id: fallbackOwnerId });
    }

    return Response.json({ ok: true, assigned, skipped });
  } catch (error: any) {
    console.error('migrateStartedBy: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}