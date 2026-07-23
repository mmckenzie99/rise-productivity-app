import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROGRESS, STATUSES, TYPES, TIMEZONES, asArray, detectTimezone } from '@/lib/speaking';
import MultiTypeSelect from './MultiTypeSelect';

const Picker = ({ label, value, items, onChange }) => (
  <div>
    <Label>{label}</Label>
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>{items.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
    </Select>
  </div>
);

export default function FormSchedule({ form, set }) {
  const tz = form.timezone || detectTimezone();
  const isPresentation = asArray(form.presentation_type).includes('Presentation(s)');

  return (
    <>
      {/* Engagement Type + Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MultiTypeSelect label="Engagement type" values={form.presentation_type || []} options={TYPES} onChange={v => set('presentation_type', v)} />
        <Picker label="Status" value={form.status} items={STATUSES} onChange={v => set('status', v)} />
      </div>

      {/* Times + Timezone */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label>Start time</Label><Input type="time" value={form.start_time || ''} onChange={e => set('start_time', e.target.value)} /></div>
        <div><Label>End time</Label><Input type="time" value={form.end_time || ''} onChange={e => set('end_time', e.target.value)} /></div>
        <div>
          <Label>Time zone</Label>
          <Select value={tz} onValueChange={v => set('timezone', v)}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>{TIMEZONES.map(z => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Presentation Details section (only for Presentation(s)) */}
      {isPresentation && (
        <div className="rounded-lg border border-[#D6DAE3] bg-[#F7F8FA] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-[#1B2A4B]">Presentation Details</span>
            <span className="rounded-full bg-[#D9A404]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#D9A404]">Presentation(s)</span>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Title of the presentation" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.presentation_description || ''} onChange={e => set('presentation_description', e.target.value)} placeholder="Description pertaining to the presentation title…" />
          </div>
        </div>
      )}

      {/* Creation Start Date + Deploy Date (only for Presentation(s)) */}
      {isPresentation && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Creation start date</Label><Input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></div>
          <div><Label>Deploy date</Label><Input type="date" value={form.deploy_date || ''} onChange={e => set('deploy_date', e.target.value)} /></div>
        </div>
      )}

      {/* Progress (under Creation Start / Deploy Date) */}
      <Picker label="Progress" value={form.progress} items={PROGRESS} onChange={v => set('progress', v)} />
    </>
  );
}