import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ResponsiveSelect from './ResponsiveSelect';
import { PROGRESS, STATUSES, TYPES, TIMEZONES, asArray, detectTimezone } from '@/lib/speaking';
import MultiTypeSelect from './MultiTypeSelect';

const inputCls = 'mt-1 border-border bg-card';
const selectCls = 'mt-1 border-border bg-card';

const Picker = ({ label, value, items, onChange }) => (
  <div>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <ResponsiveSelect value={value || ''} onValueChange={onChange} options={items.map(x => ({ value: x, label: x }))} placeholder="Select…" triggerClassName={selectCls} label={label} />
  </div>
);

export default function FormSchedule({ form, set }) {
  const tz = form.timezone || detectTimezone();
  const isPresentation = asArray(form.presentation_type).includes('Presentation(s)');
  const isBooth = asArray(form.presentation_type).includes('Booth');
  useEffect(() => { if (isBooth && form.start_date) { set('start_date', ''); } }, [isBooth]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">Schedule</h3>

      {/* Engagement Type + Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MultiTypeSelect label="Engagement type" values={form.presentation_type || []} options={TYPES} onChange={v => set('presentation_type', v)} />
        <Picker label="Status" value={form.status} items={STATUSES} onChange={v => set('status', v)} />
      </div>

      {/* Times + Timezone */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label className="text-xs text-muted-foreground">Start time</Label>
          <Input type="time" className={inputCls} value={form.start_time || ''} onChange={e => set('start_time', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">End time</Label>
          <Input type="time" className={inputCls} value={form.end_time || ''} onChange={e => set('end_time', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Time zone</Label>
          <ResponsiveSelect value={tz} onValueChange={v => set('timezone', v)} options={TIMEZONES.map(z => ({ value: z.value, label: z.label }))} placeholder="Select…" triggerClassName={selectCls} label="Time zone" />
        </div>
      </div>

      {/* Speaking date + End date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Speaking date</Label>
          <Input type="date" className={inputCls} value={form.speaking_date || ''} onChange={e => set('speaking_date', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">End date <span className="font-normal">(multi-day)</span></Label>
          <Input type="date" className={inputCls} value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>

      {/* Creation Start Date + Deploy Date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Creation start date</Label>
          <Input type="date" className={inputCls} value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Deploy date</Label>
          <Input type="date" className={inputCls} value={form.deploy_date || ''} onChange={e => set('deploy_date', e.target.value)} />
        </div>
      </div>

      <Picker label="Progress" value={form.progress} items={PROGRESS} onChange={v => set('progress', v)} />

      {/* Presentation Details section (only for Presentation(s)) */}
      {isPresentation && (
        <div className="space-y-4 rounded-lg border border-[#D9A404]/40 bg-[#FBF7EA] p-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-foreground">Presentation Details</span>
            <span className="rounded-full bg-[#D9A404]/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#D9A404]">Presentation(s)</span>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input className={inputCls} value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Title of the presentation" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea className={inputCls} value={form.presentation_description || ''} onChange={e => set('presentation_description', e.target.value)} placeholder="Description pertaining to the presentation title…" />
          </div>
        </div>
      )}
    </div>
  );
}