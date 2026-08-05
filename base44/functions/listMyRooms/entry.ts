import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Owner-only oversight list for chat rooms.
//   • Owner (is_owner=true): every ChatRoom in the app (oversight view)
//   • Everyone else: only rooms whose participant_ids include the caller
//
// Why a function: ChatRoom read-RLS is participant-only, so the Owner's
// oversight is NOT expressible in RLS — user_condition supports only `role`,
// not is_owner, and every admin shares role:admin. This function runs as the
// service role and applies the is_owner check in code, which is the only way
// to give the Owner full visibility while keeping every other admin (and
// user) to their own conversations. The service role bypasses RLS, so the
// is_owner gate here is the single source of truth for oversight.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let rooms: any[];
    if (user.is_owner) {
      rooms = await base44.asServiceRole.entities.ChatRoom.list('-last_message_at', 200);
    } else {
      rooms = await base44.asServiceRole.entities.ChatRoom.filter({ participant_ids: user.id }, '-last_message_at', 200);
    }
    return Response.json({ ok: true, rooms: rooms || [] });
  } catch (error: any) {
    console.error('listMyRooms: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}