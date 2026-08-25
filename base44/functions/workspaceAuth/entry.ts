import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { hashPassword, randomId, randomSalt } from "../../shared/workspaceAuth.ts";

// Public (no-login) workspace access. A first-time visitor creates a workspace
// (picks a name + a simple shared password); a partner joins the same workspace
// with the workspace id + that password. No Base44 user accounts are involved.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, name, password, workspace_id } = body || {};

    if (!password || typeof password !== "string" || password.length < 4) {
      return Response.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    if (action === "create") {
      if (!name || typeof name !== "string") {
        return Response.json({ error: "Workspace name is required" }, { status: 400 });
      }
      const wid = randomId();
      const salt = randomSalt();
      const password_hash = await hashPassword(password, salt);
      await base44.asServiceRole.entities.Workspace.create({
        workspace_id: wid,
        name,
        password_hash,
        salt,
      });
      return Response.json({ workspace_id: wid, name });
    }

    if (action === "join") {
      if (!workspace_id || typeof workspace_id !== "string") {
        return Response.json({ error: "Workspace ID is required" }, { status: 400 });
      }
      const list = await base44.asServiceRole.entities.Workspace.filter({ workspace_id });
      const ws = list && list[0];
      if (!ws) return Response.json({ error: "Workspace not found" }, { status: 404 });
      const hash = await hashPassword(password, ws.salt);
      if (hash !== ws.password_hash) {
        return Response.json({ error: "Incorrect password" }, { status: 401 });
      }
      return Response.json({ workspace_id: ws.workspace_id, name: ws.name });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}