import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// One-time-but-idempotent migration from the legacy room-level `archived`
// boolean to the per-participant `archived_by` array. Admin-only. Safe to run
// repeatedly: a room is SKIPPED when archived_by is already populated, and
// SKIPPED when the legacy flag was never true; only rooms with archived===true
// AND an empty archived_by are newly migrated.
//
// Intended sequencing:
//   Run #1 — after deploy, to convert the existing archived rooms.
//   Run #2 — after the UI switch, to catch any rooms archived during the brief
//            transition window (the old UI still wrote `archived` until the
//            deploy landed). Newly-migrated should be 0 (or a small gap count).
//
// This pass ONLY populates archived_by; it deliberately does NOT $unset the
// legacy `archived` field, so you can verify the before/after counts match
// before the field is removed in a separate follow-up cleanup.
//
// The response (and console log) distinguish skipped vs newly migrated, and
// report the before/after archived counts so you can confirm the numbers.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const all = await base44.asServiceRole.entities.ChatRoom.list('-updated_date', 500);
    const rooms = all || [];

    const beforeArchivedTrue = rooms.filter((r: any) => r.archived === true).length;
    const beforeArchivedByNonempty = rooms.filter((r: any) => Array.isArray(r.archived_by) && r.archived_by.length > 0).length;

    let newlyMigrated = 0;
    let alreadyMigrated = 0;
    let noLegacyFlag = 0;

    for (const r of rooms) {
      const hasBy = Array.isArray(r.archived_by) && r.archived_by.length > 0;
      const hadBool = r.archived === true;
      if (hasBy) { alreadyMigrated++; continue; }
      if (!hadBool) { noLegacyFlag++; continue; }
      // Under the old single-flag model, the room was archived at the room
      // level for everyone; approximate "who archived" as all participants.
      const ids = (r.participant_ids || []).filter(Boolean);
      await base44.asServiceRole.entities.ChatRoom.updateMany({ id: r.id }, {
        $set: { archived_by: ids },
      });
      newlyMigrated++;
    }

    const afterArchivedByNonempty = beforeArchivedByNonempty + newlyMigrated;
    const summary = {
      totalRooms: rooms.length,
      before_archived_true: beforeArchivedTrue,
      before_archived_by_nonempty: beforeArchivedByNonempty,
      newly_migrated: newlyMigrated,
      already_migrated_skipped: alreadyMigrated,
      no_legacy_flag_skipped: noLegacyFlag,
      after_archived_by_nonempty: afterArchivedByNonempty,
    };
    console.log('migrateChatArchives: summary', JSON.stringify(summary));

    return Response.json({ ok: true, summary });
  } catch (error: any) {
    console.error('migrateChatArchives: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}