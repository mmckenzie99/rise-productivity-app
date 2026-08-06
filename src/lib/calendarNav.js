// Build a /calendar route URL with the given parameters.
// Only params with truthy values are included, so the result is always clean.
export const calendarUrl = (params = {}) => {
  const sp = new URLSearchParams();
  const { view, planId, calDate, planDate, planStart, planEnd } = params;
  if (view) sp.set('view', view);
  if (planId) sp.set('planId', planId);
  if (calDate) sp.set('calDate', calDate);
  if (planDate) sp.set('planDate', planDate);
  if (planStart) sp.set('planStart', planStart);
  if (planEnd) sp.set('planEnd', planEnd);
  const qs = sp.toString();
  return qs ? `/calendar?${qs}` : '/calendar';
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export { todayStr };