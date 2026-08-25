import { useEffect, useState, useCallback } from 'react';
import { data } from '@/lib/workspaceData';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookOpen, Save, Calendar } from 'lucide-react';
import RichTextEditor from '@/components/speaking/RichTextEditor';
import { formatDate } from '@/lib/speaking';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const stripHtml = (html) => (html ? String(html).replace(/<[^>]+>/g, '').trim() : '');

export default function FaithJournal() {
  const [date, setDate] = useState(todayStr());
  const [meditation, setMeditation] = useState('');
  const [note, setNote] = useState('');
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState([]);

  const loadEntry = useCallback(async (dateKey) => {
    setLoading(true);
    try {
      const res = await data.entities.DailyReflection.filter({ date: dateKey });
      const rec = res && res[0];
      setRecord(rec || null);
      setMeditation(rec?.meditation || '');
      setNote(rec?.note || '');
    } catch {
      setRecord(null);
      setMeditation('');
      setNote('');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      setEntries(await data.entities.DailyReflection.list('-date', 200));
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => { loadEntry(date); }, [date, loadEntry]);
  useEffect(() => { loadEntries(); }, [loadEntries]);

  const save = async () => {
    setSaving(true);
    try {
      if (record?.id) {
        const updated = await data.entities.DailyReflection.update(record.id, { meditation, note });
        setRecord(updated);
      } else {
        const created = await data.entities.DailyReflection.create({ date, meditation, note });
        setRecord(created);
      }
      await loadEntries();
    } finally {
      setSaving(false);
    }
  };

  const preview = (entry) => {
    const m = stripHtml(entry.meditation);
    if (m) return m;
    const n = stripHtml(entry.note);
    return n ? n.slice(0, 120) : 'Empty entry';
  };

  return (
    <div className="space-y-5">
      {/* Editor */}
      <div className="rounded-lg border border-[#D6DAE3] bg-white p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#D9A404]" />
          <h2 className="font-display text-lg font-semibold text-[#1B2A4B]">Meditation &amp; Notes</h2>
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border-[#D6DAE3] text-[#1B2A4B]"
          />
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Meditation</Label>
          <Textarea
            value={meditation}
            onChange={(e) => setMeditation(e.target.value)}
            rows={4}
            placeholder="Bible verse or Spirit of Prophecy statement to meditate on…"
            className="border-[#D6DAE3] placeholder:text-[#5A6781]"
          />
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-[11px] text-[#5A6781]">Notes</Label>
          <div className="rich-notes-light">
            <RichTextEditor
              value={note}
              onChange={setNote}
              placeholder="Reflections, thoughts, prayers…"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={save}
            disabled={saving || loading}
            className="bg-[#D9A404] text-white hover:bg-[#D9A404]/90"
          >
            <Save className="mr-1 h-4 w-4" />
            {saving ? 'Saving…' : 'Save Entry'}
          </Button>
          {record?.id && !saving && (
            <span className="text-[11px] text-[#5A6781]">Saved entry for this day.</span>
          )}
        </div>
      </div>

      {/* Journal feed */}
      <div>
        <h3 className="mb-2 font-display text-base font-semibold text-[#1B2A4B]">Journal</h3>
        {entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#D6DAE3] bg-white p-4 text-sm text-[#5A6781]">
            No entries yet. Pick a date above and write your first meditation.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setDate(e.date)}
                  className="w-full rounded-md border border-[#D6DAE3] bg-white p-3 text-left transition hover:border-[#D9A404]"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#D9A404]" />
                    <span className="text-xs font-semibold text-[#1B2A4B]">{formatDate(e.date)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#5A6781] line-clamp-2">{preview(e)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}