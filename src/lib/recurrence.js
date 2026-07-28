const WD_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WD_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Last'];

const toDate = (s) => new Date(`${s}T00:00:00`);
const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const nthWeekdayOfMonth = (year, month, weekday, ordinal) => {
  if (ordinal === 4) {
    const d = new Date(year, month + 1, 0);
    while (d.getDay() !== weekday) d.setDate(d.getDate() - 1);
    return d;
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + ordinal * 7);
};

const computeOrdinal = (d) => {
  const ord = Math.floor((d.getDate() - 1) / 7);
  const nextWeek = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
  if (nextWeek.getMonth() !== d.getMonth()) return 4;
  return Math.min(ord, 3);
};

const fmt = (s) => {
  try { return toDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return s; }
};

const META = ['recurrence_freq', 'recurrence_interval', 'recurrence_weekdays', 'recurrence_monthly_mode', 'recurrence_end_mode', 'recurrence_end_count', 'recurrence_end_until'];

const stripMeta = (form) => {
  const base = { ...form };
  META.forEach((k) => delete base[k]);
  return base;
};

const buildOccurrence = (form, d) => {
  const base = stripMeta(form);
  const newDate = toKey(d);
  let newEnd = base.end_date;
  if (base.all_day && base.end_date) {
    const delta = Math.round((d - toDate(base.date)) / 86400000);
    newEnd = toKey(new Date(toDate(base.end_date).getTime() + delta * 86400000));
  }
  return { ...base, date: newDate, end_date: newEnd, completed: false, completed_date: '' };
};

export const generateOccurrences = (form) => {
  const startStr = form.date;
  const freq = form.recurrence_freq;
  if (!startStr || !freq || freq === 'none') return [stripMeta(form)];

  const interval = Math.max(1, Number(form.recurrence_interval) || 1);
  const endMode = form.recurrence_end_mode || 'never';
  const MAX = 366;
  const countLimit = endMode === 'count' ? Math.min(Math.max(Number(form.recurrence_end_count) || 1, 1), MAX) : MAX;
  const untilDate = endMode === 'until' && form.recurrence_end_until ? toDate(form.recurrence_end_until) : null;
  const start = toDate(startStr);

  const occurrences = [];
  const canAdd = (d) => occurrences.length < countLimit && (!untilDate || d <= untilDate);

  if (freq === 'daily') {
    let d = new Date(start);
    let guard = 0;
    while (canAdd(d) && guard < MAX + 10) {
      occurrences.push(buildOccurrence(form, d));
      d = new Date(d);
      d.setDate(d.getDate() + interval);
      guard++;
    }
  } else if (freq === 'weekly') {
    const weekdays = (form.recurrence_weekdays && form.recurrence_weekdays.length)
      ? [...form.recurrence_weekdays].sort((a, b) => a - b)
      : [start.getDay()];
    const baseWeekStart = new Date(start);
    baseWeekStart.setDate(start.getDate() - start.getDay());
    let guard = 0;
    while (occurrences.length < countLimit && (!untilDate || baseWeekStart <= untilDate) && guard < 600) {
      for (const wd of weekdays) {
        const d = new Date(baseWeekStart);
        d.setDate(baseWeekStart.getDate() + wd);
        if (d < start) continue;
        if (canAdd(d)) occurrences.push(buildOccurrence(form, d));
        if (occurrences.length >= countLimit) break;
      }
      baseWeekStart.setDate(baseWeekStart.getDate() + interval * 7);
      guard++;
    }
  } else if (freq === 'monthly') {
    if (form.recurrence_monthly_mode === 'day_of_week') {
      const wd = start.getDay();
      const ordinal = computeOrdinal(start);
      let y = start.getFullYear();
      let m = start.getMonth();
      let guard = 0;
      while (occurrences.length < countLimit && guard < 600) {
        const d = nthWeekdayOfMonth(y, m, wd, ordinal);
        if (d >= start && canAdd(d)) occurrences.push(buildOccurrence(form, d));
        m += interval;
        while (m > 11) { m -= 12; y++; }
        guard++;
      }
    } else {
      const dayNum = start.getDate();
      let y = start.getFullYear();
      let m = start.getMonth();
      let guard = 0;
      while (occurrences.length < countLimit && guard < 600) {
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = new Date(y, m, Math.min(dayNum, lastDay));
        if (d >= start && canAdd(d)) occurrences.push(buildOccurrence(form, d));
        m += interval;
        while (m > 11) { m -= 12; y++; }
        guard++;
      }
    }
  }

  return occurrences.length ? occurrences : [stripMeta(form)];
};

export const recurrenceSummary = (form) => {
  const freq = form.recurrence_freq;
  if (!freq || freq === 'none') return 'Does not repeat';
  const interval = Math.max(1, Number(form.recurrence_interval) || 1);
  const unit = freq === 'daily' ? 'day' : freq === 'weekly' ? 'week' : 'month';
  let s = interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
  if (freq === 'weekly' && form.recurrence_weekdays && form.recurrence_weekdays.length) {
    const days = [...form.recurrence_weekdays].sort((a, b) => a - b).map((w) => WD_SHORT[w]).join(', ');
    s += ` on ${days}`;
  }
  if (freq === 'monthly' && form.recurrence_monthly_mode === 'day_of_week') {
    const d = toDate(form.date);
    if (d) s += ` on the ${ORDINALS[computeOrdinal(d)]} ${WD_FULL[d.getDay()]}`;
  }
  const endMode = form.recurrence_end_mode || 'never';
  if (endMode === 'count') s += `, ${Math.max(1, Number(form.recurrence_end_count) || 1)} times`;
  else if (endMode === 'until' && form.recurrence_end_until) s += `, until ${fmt(form.recurrence_end_until)}`;
  else s += ', forever';
  return s;
};