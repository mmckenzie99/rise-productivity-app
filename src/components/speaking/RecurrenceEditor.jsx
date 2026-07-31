import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ResponsiveSelect from './ResponsiveSelect';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { recurrenceSummary } from '@/lib/recurrence';

const WD_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecurrenceEditor({ form, set }) {
  const freq = form.recurrence_freq || 'none';
  const interval = Number(form.recurrence_interval) || 1;
  const unit = freq === 'daily' ? 'day' : freq === 'weekly' ? 'week' : 'month';

  const toggleWeekday = (day) => {
    const cur = form.recurrence_weekdays || [];
    const next = cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day];
    set('recurrence_weekdays', next);
  };

  const isWeekdayActive = (day) => (form.recurrence_weekdays || []).includes(day);

  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Repeat</Label>
          <ResponsiveSelect value={freq} onValueChange={(v) => set('recurrence_freq', v)} options={[{ value: 'none', label: 'Does not repeat' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }]} triggerClassName="border-border" />
        </div>
        {freq !== 'none' && (
          <div className="space-y-1.5">
            <Label>Every</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={form.recurrence_interval}
                onChange={(e) => set('recurrence_interval', e.target.value)}
                className="w-20 border-border"
              />
              <span className="text-sm text-muted-foreground">{interval === 1 ? unit : `${unit}s`}</span>
            </div>
          </div>
        )}
      </div>

      {freq === 'weekly' && (
        <div className="space-y-1.5">
          <Label>On these days</Label>
          <div className="flex gap-1">
            {WD_FULL.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleWeekday(i)}
                className={`h-8 w-9 rounded-md border text-xs font-medium transition ${
                  isWeekdayActive(i) ? 'border-[#D9A404] bg-[#D9A404] text-white' : 'border-border bg-card text-foreground'
                }`}
              >
                {d[0]}
              </button>
            ))}
          </div>
          {(form.recurrence_weekdays || []).length === 0 && (
            <p className="text-[11px] text-muted-foreground">Defaults to the start date's weekday.</p>
          )}
        </div>
      )}

      {freq === 'monthly' && (
        <div className="space-y-1.5">
          <Label>Monthly pattern</Label>
          <RadioGroup
            value={form.recurrence_monthly_mode || 'day_of_month'}
            onValueChange={(v) => set('recurrence_monthly_mode', v)}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="day_of_month" id="rm-dom" />
              <Label htmlFor="rm-dom" className="text-sm font-normal">On the same day each month</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="day_of_week" id="rm-dow" />
              <Label htmlFor="rm-dow" className="text-sm font-normal">On the same weekday (e.g. 2nd Tuesday)</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {freq !== 'none' && (
        <div className="space-y-1.5">
          <Label>Ends</Label>
          <RadioGroup
            value={form.recurrence_end_mode || 'never'}
            onValueChange={(v) => set('recurrence_end_mode', v)}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="never" id="re-never" />
              <Label htmlFor="re-never" className="text-sm font-normal">Never</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="count" id="re-count" />
              <Label htmlFor="re-count" className="text-sm font-normal">After</Label>
              <Input
                type="number"
                min={1}
                max={366}
                value={form.recurrence_end_count}
                onChange={(e) => set('recurrence_end_count', e.target.value)}
                className="w-20 border-border"
                disabled={form.recurrence_end_mode !== 'count'}
              />
              <span className="text-sm text-muted-foreground">occurrences</span>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="until" id="re-until" />
              <Label htmlFor="re-until" className="text-sm font-normal">On</Label>
              <Input
                type="date"
                min={form.date || undefined}
                value={form.recurrence_end_until || ''}
                onChange={(e) => set('recurrence_end_until', e.target.value)}
                className="w-40 border-border"
                disabled={form.recurrence_end_mode !== 'until'}
              />
            </div>
          </RadioGroup>
        </div>
      )}

      {freq !== 'none' && (
        <p className="text-xs font-medium text-foreground">{recurrenceSummary(form)}</p>
      )}
    </div>
  );
}