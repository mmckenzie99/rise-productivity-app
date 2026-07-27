import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, BookOpen } from 'lucide-react';

export default function DailyReflection({ dateKey }) {
  const [record, setRecord] = useState(null);
  const [goals, setGoals] = useState('');
  const [meditation, setMeditation] = useState('');
  const [reference, setReference] = useState('');
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
        setGoals(rec?.goals || '');
        setMeditation(rec?.meditation || '');
        setReference(rec?.meditation_reference || '');
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

  const onBlurGoals = () => {
    if (goals !== (record?.goals || '')) persist({ goals });
  };
  const onBlurMeditation = () => {
    if (meditation !== (record?.meditation || '')) persist({ meditation });
  };
  const onBlurReference = () => {
    if (reference !== (record?.meditation_reference || '')) persist({ meditation_reference: reference });
  };

  if (loading) {
    return <div className="rounded-md border border-[#D6DAE3] bg-white p-3 text-sm text-[#5A6781]">Loading reflection…</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-md border border-[#D6DAE3] bg-white p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[#1B2A4B]">
          <Target className="h-3.5 w-3.5 text-[#D9A404]" />
          <span className="text-xs font-semibold uppercase tracking-wider">Goals for the day</span>
        </div>
        <Textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          onBlur={onBlurGoals}
          rows={4}
          placeholder="What do you want to accomplish today?"
          className="border-[#D6DAE3]"
        />
      </div>
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
      </div>
      {saving && <p className="text-[10px] text-[#5A6781] sm:col-span-2">Saving…</p>}
    </div>
  );
}