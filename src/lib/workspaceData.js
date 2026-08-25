// Workspace-scoped data client. Mirrors the base44 SDK entity interface
// (list/filter/get/create/update/delete/subscribe) so existing hooks swap over
// with a one-line import change. Every call authenticates with the stored
// workspace credentials and is scoped to that workspace by the `data` backend
// function (service role). Realtime subscriptions are no-ops in this model.
import { base44 } from '@/api/base44Client';
import { getSession } from '@/lib/workspaceSession';

function creds() {
  const s = getSession();
  if (!s) throw new Error('No workspace session');
  return { workspace_id: s.workspace_id, password: s.password };
}

async function call(payload) {
  const res = await base44.functions.invoke('data', payload);
  return res.data;
}

function makeEntity(name) {
  return {
    async list(sort, limit) {
      const r = await call({ op: 'list', entity: name, ...creds(), sort, limit });
      return r.items;
    },
    async filter(query, sort, limit) {
      const r = await call({ op: 'list', entity: name, ...creds(), filter: query || {}, sort, limit });
      return r.items;
    },
    async get(id) {
      const r = await call({ op: 'get', entity: name, ...creds(), id });
      return r.item;
    },
    async create(data) {
      const r = await call({ op: 'create', entity: name, ...creds(), data });
      return r.item;
    },
    async update(id, data) {
      const r = await call({ op: 'update', entity: name, ...creds(), id, data });
      return r.item;
    },
    async delete(id) {
      await call({ op: 'delete', entity: name, ...creds(), id });
    },
    subscribe() {
      return () => {};
    },
  };
}

export const data = {
  entities: {
    Engagement: makeEntity('Engagement'),
    Trip: makeEntity('Trip'),
    CalendarEvent: makeEntity('CalendarEvent'),
    Task: makeEntity('Task'),
    InboxItem: makeEntity('InboxItem'),
    Fitness: makeEntity('Fitness'),
    DailyReflection: makeEntity('DailyReflection'),
    WeeklyGoal: makeEntity('WeeklyGoal'),
    Notification: makeEntity('Notification'),
    Comment: makeEntity('Comment'),
    PlanComment: makeEntity('PlanComment'),
  },
};