import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { data } from '@/lib/workspaceData';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/speaking/RichTextEditor';
import SectionCard from '@/components/faith/SectionCard';
import { Save, Calendar, BookMarked, BookOpen, Pencil, Target, Heart } from 'lucide-react';
import { formatDate } from '@/lib/speaking';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const stripHtml = (html) => (html ? String(html).replace(/<[^>]+>/g, '').trim() : '');

export default function FaithJournal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date') || todayStr();
  const setDate = (d) => setSearchParams({ date: d }, { replace: true });
  const { load: loadFlags } = useImportantFlags();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);
  const [engagements, setEngagements] = useState([]);

  const [durationMinutes, setDurationMinutes] = useState('');
  const [isSermonPrep, setIsSermonPrep] = useState(false);
  const [linkedEngagementId, setLinkedEngagementId] = useState('');
  const [readingBookTitle, setReadingBookTitle] = useState('');
  const [readingQuote, setReadingQuote] = useState('');
  const [readingReference, setReadingReference] = useState('');
  const [readingFocusTitle, setReadingFocusTitle] = useState('');
  const [studyNotes, setStudyNotes] = useState('');
  const [studyFocusTitle, setStudyFocusTitle] = useState('');
  const [takeaways, setTakeaways] = useState('');
  const [prayerNotes, setPrayerNotes] = useState('');
  const [prayerTitle, setPrayerTitle] = useState('');

  const loadEntry = useCallback(async (dateKey) => {
    setLoading(true);
    try {
      const res = await data.entities.DailyReflection.filter({ date: dateKey });
      const rec = res && res[0];
      setRecord(rec || null);
      setDurationMinutes(rec?.duration_minutes ?? '');
      setIsSermonPrep(!!rec?.is_sermon_prep);
      setLinkedEngagementId(rec?.linked_engagement_id || '');
      setReadingBookTitle(rec?.reading_book_title || '');
      setReadingQuote(rec?.reading_quote || '');
      setReadingReference(rec?.reading_reference || '');
      setReadingFocusTitle(rec?.reading_focus_title || '');
      setStudyNotes(rec?.study_notes || '');
      setStudyFocusTitle(rec?.study_focus_title || '');
      setTakeaways(rec?.takeaways || '');
      setPrayerNotes(rec?.prayer_notes || '');
      setPrayerTitle(rec?.prayer_title || '');
    } catch {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try { setEntries(await data.entities.DailyReflection.list('-date', 200)); }
    catch { setEntries([]); }
  }, []);

  useEffect(() => { loadEntry(date); }, [date, loadEntry]);
  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => {
    data.entities.Engagement.list('speaking_date').then(setEngagements).catch(() => {});
  }, []);

  // Create/update/remove the sermon-prep InboxItem so the entry shows in the
  // Inbox as something being worked on. message_date carries the entry's date
  // so the Inbox can deep-link back to this day.
  const syncSermonPrepFlag = async (recordId, flagged, dateKey) => {
    const title = `Sermon Prep — ${formatDate(dateKey)}`;
    const existing = await data.entities.InboxItem.filter({ source_type: 'DailyReflection', source_id: recordId });
    const ex = existing && existing[0];
    if (flagged) {
      const payload = {
        is_important: true,
        source_type: 'DailyReflection',
        source_id: recordId,
        source_title: title,
        message_text: title,
        message_date: `${dateKey}T12:00:00.000Z`,
        entity_type: 'None',
      };
      if (ex) await data.entities.InboxItem.update(ex.id, payload);
      else await data.entities.InboxItem.create(payload);
    } else if (ex) {
      await data.entities.InboxItem.update(ex.id, { is_important: false });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        duration_minutes: durationMinutes === '' ? null : Number(durationMinutes),
        is_sermon_prep: !!isSermonPrep,
        linked_engagement_id: linkedEngagementId || null,
        reading_book_title: readingBookTitle,
        reading_quote: readingQuote,
        reading_reference: readingReference,
        reading_focus_title: readingFocusTitle,
        study_notes: studyNotes,
        study_focus_title: studyFocusTitle,
        takeaways,
        prayer_notes: prayerNotes,
        prayer_title: prayerTitle,
      };
      let saved;
      if (record?.id) saved = await data.entities.DailyReflection.update(record.id, payload);
      else saved = await data.entities.DailyReflection.create({ date, ...payload });
      setRecord(saved);
      await syncSermonPrepFlag(saved.id, isSermonPrep, date);
      await Promise.all([loadEntries(), loadFlags()]);
    } finally {
      setSaving(false);
    }
  };

  const preview = (e) => {
    if (e.reading_book_title) return e.reading_book_title;
    const s = stripHtml(e.study_notes);
    if (s) return s.slice(0, 120);
    if (e.takeaways) return e.takeaways.slice(0, 120);
    return 'No content yet';
  };

  return (
    <div className="space-y-5">
      {/* Section 1: Details */}
      <SectionCard title="Details" icon={BookMarked}>
        <div className="space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-[#D6DAE3] text-[#1B2A4B]" />
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Time spent (minutes)</Label>
          <Input type="number" min="0" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="0" className="border-[#D6DAE3] text-[#1B2A4B]" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <Label className="text-[11px] text-[#5A6781]">Mark as sermon prep</Label>
            <p className="text-[10px] text-[#9AA4B8]">Flags this in the Inbox as something being worked on.</p>
          </div>
          <Switch checked={isSermonPrep} onCheckedChange={setIsSermonPrep} />
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Associate with a Duty (engagement)</Label>
          <select value={linkedEngagementId} onChange={(e) => setLinkedEngagementId(e.target.value)} className="h-10 w-full rounded-md border border-[#D6DAE3] bg-white px-3 text-sm text-[#1B2A4B]">
            <option value="">None</option>
            {engagements.map((e) => (
              <option key={e.id} value={e.id}>{e.place || 'No place'} — {e.title || e.speaker_name || 'Engagement'}</option>
            ))}
          </select>
        </div>
      </SectionCard>

      {/* Section 2: Reading Focus (renameable) */}
      <SectionCard title="Reading Focus" icon={BookOpen} editable titleValue={readingFocusTitle} onTitleChange={setReadingFocusTitle}>
        <div className="space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Book title</Label>
          <Input value={readingBookTitle} onChange={(e) => setReadingBookTitle(e.target.value)} placeholder="e.g. The Great Controversy" className="border-[#D6DAE3] text-[#1B2A4B]" />
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Quote / paragraph</Label>
          <Textarea value={readingQuote} onChange={(e) => setReadingQuote(e.target.value)} rows={3} placeholder="A sentence or paragraph that stood out…" className="border-[#D6DAE3] text-[#1B2A4B]" />
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Bible reference</Label>
          <Input value={readingReference} onChange={(e) => setReadingReference(e.target.value)} placeholder="e.g. John 3:16, Romans 8:28" className="border-[#D6DAE3] text-[#1B2A4B]" />
        </div>
      </SectionCard>

      {/* Section 3: Study Focus (renameable) */}
      <SectionCard title="Study Focus" icon={Pencil} editable titleValue={studyFocusTitle} onTitleChange={setStudyFocusTitle}>
        <div className="rich-notes-light">
          <RichTextEditor value={studyNotes} onChange={setStudyNotes} placeholder="Study notes — bold, underline, highlight, or paste a link to Logos / Bible Gateway…" />
        </div>
      </SectionCard>

      {/* Section 4: Takeaways & Goals */}
      <SectionCard title="Takeaways & Goals" icon={Target}>
        <Textarea value={takeaways} onChange={(e) => setTakeaways(e.target.value)} rows={5} placeholder="Main takeaways and personal spiritual goals…" className="border-[#D6DAE3] text-[#1B2A4B]" />
      </SectionCard>

      {/* Section 5: Prayer (renameable) */}
      <SectionCard title="What Should I Pray About" icon={Heart} editable titleValue={prayerTitle} onTitleChange={setPrayerTitle}>
        <Textarea value={prayerNotes} onChange={(e) => setPrayerNotes(e.target.value)} rows={5} placeholder="Personal prayer notes…" className="border-[#D6DAE3] text-[#1B2A4B]" />
      </SectionCard>

      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={saving || loading} className="bg-[#D9A404] text-white hover:bg-[#D9A404]/90">
          <Save className="mr-1 h-4 w-4" />
          {saving ? 'Saving…' : 'Save Entry'}
        </Button>
        {record?.id && !saving && <span className="text-[11px] text-[#5A6781]">Saved entry for this day.</span>}
      </div>

      {/* Journal feed */}
      <div>
        <h3 className="mb-2 font-display text-base font-semibold text-[#1B2A4B]">Journal</h3>
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#D6DAE3] bg-white p-4 text-sm text-[#5A6781]">No entries yet. Pick a date above and begin your first Daily Meditation.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => setDate(e.date)} className="flex w-full items-start gap-2 rounded-md border border-[#D6DAE3] bg-white p-3 text-left transition hover:border-[#D9A404]">
                  <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D9A404]" />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-[#1B2A4B]">{formatDate(e.date)}</span>
                    <p className="text-xs text-[#5A6781] line-clamp-2">{preview(e)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}