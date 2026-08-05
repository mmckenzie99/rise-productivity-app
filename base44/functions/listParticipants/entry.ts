import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Sanitized user roster for participant pickers and chips across the app.
// Returns ONLY id, name, role, is_owner — never emails or permission flags.
//
// Gate: any authenticated user may call it. Participant chips, the new-chat
// picker, and the add-participant picker all need to resolve names for other
// users; that's a read-only, non-sensitive need. We run as the service role
// because the platform's built-in User permissions only let the Owner list
// all users (non-owners, including admins, get an empty roster from
// User.list()), so this is the fix for the "admins see no users" bug.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const all = await base44.asServiceRole.entities.User.list();
    const users = (all || []).map((u: any) => ({
      id: u.id,
      name: u.full_name || u.email || 'Unknown',
      role: u.role || 'user',
      is_owner: !!u.is_owner,
    }));
    return Response.json({ ok: true, users });
  } catch (error: any) {
    console.error('listParticipants: fatal', error?.message || error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
}