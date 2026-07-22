// ICS calendar file generation and download utilities.
// Works with Apple Calendar, Outlook, Google Calendar, and any ICS-compatible app.

const escapeICS = (text) =>
  String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

// Convert "HH:MM" time string + date to an ICS datetime with TZID
const toICSDateTime = (date, time, timezone) => {
  if (!date) return '';
  const t = time || '00:00';
  return `;TZID=${timezone || 'America/New_York'}:${date.replace(/-/g, '')}T${t.replace(':', '')}00`;
};

const formatDateStamp = (d) => {
  const dt = d ? new Date(d) : new Date();
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

export function generateICS(engagement) {
  const tz = engagement.timezone || 'America/New_York';
  const dtStart = toICSDateTime(engagement.speaking_date || engagement.start_date, engagement.start_time, tz);
  const dtEnd = toICSDateTime(engagement.speaking_date || engagement.start_date, engagement.end_time || engagement.start_time, tz);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Engagement Log//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:engagement-${engagement.id || Date.now()}@engagement-log`,
    `DTSTAMP:${formatDateStamp()}`,
    dtStart && `DTSTART${dtStart}`,
    dtEnd && `DTEND${dtEnd}`,
    `SUMMARY:${escapeICS(engagement.title)}`,
    engagement.description && `DESCRIPTION:${escapeICS(engagement.description)}`,
    engagement.address && `LOCATION:${escapeICS(engagement.address)}`,
    engagement.speaker_name && `ATTENDEE:${escapeICS(engagement.speaker_name)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function generateICSBatch(engagements) {
  const events = engagements
    .filter((e) => e.speaking_date || e.start_date)
    .map((engagement) => {
      const tz = engagement.timezone || 'America/New_York';
      const dtStart = toICSDateTime(engagement.speaking_date || engagement.start_date, engagement.start_time, tz);
      const dtEnd = toICSDateTime(engagement.speaking_date || engagement.start_date, engagement.end_time || engagement.start_time, tz);
      return [
        'BEGIN:VEVENT',
        `UID:engagement-${engagement.id || Date.now()}@engagement-log`,
        `DTSTAMP:${formatDateStamp()}`,
        dtStart && `DTSTART${dtStart}`,
        dtEnd && `DTEND${dtEnd}`,
        `SUMMARY:${escapeICS(engagement.title)}`,
        engagement.description && `DESCRIPTION:${escapeICS(engagement.description)}`,
        engagement.address && `LOCATION:${escapeICS(engagement.address)}`,
        'END:VEVENT',
      ].filter(Boolean).join('\r\n');
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Engagement Log//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(content, filename = 'engagement.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}