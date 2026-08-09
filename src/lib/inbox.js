import { EMPTY, detectTimezone } from '@/lib/speaking';
import { defaultTrip } from '@/lib/trips';

const pad2 = (v) => String(v).padStart(2, '0');

export const nowISO = () => new Date().toISOString();

// Convert an ISO datetime to a <input type="datetime-local"> value (local time).
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

// Convert a <input type="datetime-local"> value to an ISO string.
export const fromLocalInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
};

export const localDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const localTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

// An item is "due" when its reminder time has passed.
export const isDue = (item) => {
  if (!item.reminder_at) return false;
  const d = new Date(item.reminder_at);
  return !isNaN(d.getTime()) && d.getTime() <= Date.now();
};

// Derive a short title from a message body (first non-empty line, truncated).
export const firstLine = (text) => {
  const line = String(text || '').split('\n').map((l) => l.trim()).find(Boolean) || '';
  return line.length > 60 ? line.slice(0, 57) + '…' : line;
};

// Build a context note capturing the original message provenance.
const contextNote = (item) => {
  const parts = [];
  if (item.sender) parts.push(`From: ${item.sender}`);
  if (item.message_date) parts.push(`Received: ${formatDateTime(item.message_date)}`);
  parts.push(String(item.message_text || ''));
  return parts.join('\n\n');
};

// Pre-fill builders for each conversion target. Only fields that make sense
// from the captured message/sender/date are populated; the rest stay default.
export const buildTaskPrefill = (item) => ({
  title: firstLine(item.message_text) || 'Follow up',
  date: localDate(item.message_date) || localDate(nowISO()),
  all_day: false,
  end_date: '',
  start_time: localTime(item.message_date) || '',
  end_time: '',
  category: 'Personal',
  location_type: 'In-person',
  notes: contextNote(item),
  assignee_id: '',
  assignee_name: '',
  completed: false,
  completed_date: '',
});

export const buildEngagementPrefill = (item) => ({
  ...EMPTY,
  title: firstLine(item.message_text) || 'New engagement',
  description: String(item.message_text || ''),
  speaking_date: localDate(item.message_date) || '',
  start_time: localTime(item.message_date) || '',
  notes: contextNote(item),
  timezone: detectTimezone(),
});

export const buildTripPrefill = (item) => ({
  ...defaultTrip,
  leave_date: localDate(item.message_date) || '',
  leave_time: localTime(item.message_date) || '',
});