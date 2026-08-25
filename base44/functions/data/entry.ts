import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { validateWorkspace } from "../../shared/workspaceAuth.ts";

// Generic, workspace-scoped data access for the no-account access model.
// Every call authenticates with (workspace_id, password); all reads/writes
// are scoped to that workspace and the server stamps workspace_id on creates,
// so a client can never read or plant data in another workspace. Direct
// app-user SDK access to these entities is denied via RLS (read/create/update/
// delete = false), so only this service-role path can reach the data.
const ENTITIES = new Set([
  "Engagement",
  "Trip",
  "CalendarEvent",
  "Task",
  "InboxItem",
  "Fitness",
  "DailyReflection",
  "WeeklyGoal",
  "Notification",
  "Comment",
  "PlanComment",
]);

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { op, entity, workspace_id, password, id, data, filter, sort, limit } = body || {};

    if (!ENTITIES.has(entity)) {
      return Response.json({ error: "Unknown entity" }, { status: 400 });
    }
    const ws = await validateWorkspace(base44, workspace_id, password);
    if (!ws) return Response.json({ error: "Invalid workspace credentials" }, { status: 401 });

    const coll = base44.asServiceRole.entities[entity];
    if (!coll) return Response.json({ error: "Entity not available" }, { status: 400 });

    if (op === "list") {
      const q = { ...(filter || {}), workspace_id };
      const items = await coll.filter(q, sort, limit);
      return Response.json({ items });
    }
    if (op === "get") {
      const item = await coll.get(id);
      if (!item || item.workspace_id !== workspace_id) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      return Response.json({ item });
    }
    if (op === "create") {
      const rec = await coll.create({ ...(data || {}), workspace_id });
      return Response.json({ item: rec });
    }
    if (op === "update") {
      const existing = await coll.get(id);
      if (!existing || existing.workspace_id !== workspace_id) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      const rec = await coll.update(id, { ...(data || {}), workspace_id });
      return Response.json({ item: rec });
    }
    if (op === "delete") {
      const existing = await coll.get(id);
      if (!existing || existing.workspace_id !== workspace_id) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      await coll.delete(id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown op" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}