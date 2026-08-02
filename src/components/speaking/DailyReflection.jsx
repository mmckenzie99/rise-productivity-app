import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, StickyNote, Send } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { Button } from '@/components/ui/button';
import ResponsiveSelect from './ResponsiveSelect';
import { formatDate } from '@/lib/speaking';

export default function DailyReflection({ dateKey, engagements = [] }) {
  const [record, setRecord] = useState(null);
  const [meditation, setMeditation] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const noteTimer = useRef(null);
  const [linkedId, setLinkedId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.DailyReflection.filter({ date: dateKey })
      .then((res) => {
        if (!active) return;
        const rec = res && res[0];
        setRecord(rec || null);
        setMeditation(rec?.meditation || '');
        setReference(rec?.meditation_reference || '');
        setNote(rec?.note || '');
        setLinkedId(rec?.linked_engagement_id || '');
        setSynced(false);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [dateKey]);

  const persist = async (patch) => {
    setSaving(true);
    try {
      if (record?.id) {
        const updated = await base44.entities.DailyReflection.update(record.id, patch);
        setRecord(updated);
      } else {
        const created = await base44.entities.DailyReflection.create({ date: dateKey, ...patch });
        setRecord(created);
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      if (note !== (record?.note || '')) persist({ note });
    }, 700);
    return () => { if (noteTimer.current) clearTimeout(noteTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  const onBlurMeditation = () => {
    if (meditation !== (record?.meditation || '')) persist({ meditation });
  };
  const onBlurReference = () => {
    if (reference !== (record?.meditation_reference || '')) persist({ meditation_reference: reference });
  };

  const linkable = (engagements || [])
    .filter((e) => e.status !== 'Completed')
    .sort((a, b) => (a.speaking_date || '').localeCompare(b.speaking_date || ''));

  const onLinkChange = (v) => {
    setLinkedId(v);
    setSynced(false);
    persist({ linked_engagement_id: v });
  };

  const syncToEngagement = async () => {
    if (!linkedId || !note) return;
    setSyncing(true);
    try {
      const eng = await base44.entities.Engagement.get(linkedId);
      const dateLabel = formatDate(dateKey);
      const entry = `<div style="border-top:1px solid #E3E6EC;margin-top:8px;padding-top:8px"><p style="font-size:11px;color:#5A6781;margin:0 0 4px"><strong>${dateLabel}</strong></p>${note}</div>`;
      const newNotes = (eng?.notes || '') + entry;
      await base44.entities.Engagement.update(linkedId, { notes: newNotes });
      setSynced(true);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="rounded-md border border-[#D6DAE3] bg-white p-3 text-sm text-[#5A6781]">Loading reflection…</div>;
  }

  return (
    <div className="rounded-md border border-[#D6DAE3] bg-white p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[#1B2A4B]">
        <BookOpen className="h-3.5 w-3.5 text-[#D9A404]" />
        <span className="text-xs font-semibold uppercase tracking-wider">Meditation</span>
      </div>
      <Textarea
        value={meditation}
        onChange={(e) => setMeditation(e.target.value)}
        onBlur={onBlurMeditation}
        rows={3}
        placeholder="Bible verse or Spirit of Prophecy statement to meditate on…"
        className="border-[#D6DAE3]"
      />
      <div className="mt-2 space-y-1">
        <Label className="text-[11px] text-[#5A6781]">Reference / source</Label>
        <Input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          onBlur={onBlurReference}
          placeholder="e.g. John 3:16, Desire of Ages p. 123"
          className="border-[#D6DAE3]"
        />
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1.5 text-[#1B2A4B]">
          <StickyNote className="h-3.5 w-3.5 text-[#D9A404]" />
          <span className="text-xs font-semibold uppercase tracking-wider">Note</span>
        </div>
        <RichTextEditor
          value={note}
          onChange={setNote}
          placeholder="Add a note — bold, italics, underline, highlight, or link…"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ResponsiveSelect
            value={linkedId}
            onValueChange={onLinkChange}
            options={linkable.map((e) => ({ value: e.id, label: `${e.place || 'No place'} — ${e.title || e.speaker_name || 'Engagement'}` }))}
            placeholder="Link an engagement…"
            triggerClassName="h-8 w-full min-w-[180px] border-[#D6DAE3] text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!linkedId || !note || syncing}
            onClick={syncToEngagement}
            className="h-8 border-[#D6DAE3] bg-white"
          >
            <Send className="mr-1 h-3.5 w-3.5" />
            {syncing ? 'Syncing…' : synced ? 'Synced ✓' : 'Sync to Engagement'}
          </Button>
        </div>
      </div>
      {saving && <p className="mt-2 text-[10px] text-[#5A6781]">Saving…</p>}
    </div>
  );
}