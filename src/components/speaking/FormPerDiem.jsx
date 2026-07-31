import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ResponsiveSelect from './ResponsiveSelect';
import { Plus, Trash2 } from 'lucide-react';
import { PER_DIEM_TYPES, PER_DIEM_RATES, defaultPerDiemDay, calcPerDiemTotal, formatCurrency } from '@/lib/trips';
import FileUploadButton from './FileUploadButton';

export default function FormPerDiem({ form, set }) {
  const days = form.per_diem_days || [];

  const addDay = () => set('per_diem_days', [...days, defaultPerDiemDay()]);
  const removeDay = (i) => set('per_diem_days', days.filter((_, idx) => idx !== i));
  const updateDay = (i, key, val) => {
    const next = [...days];
    next[i] = { ...next[i], [key]: val };
    if (key === 'type') next[i].amount = PER_DIEM_RATES[val];
    set('per_diem_days', next);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Per Diem Reimbursement</h3>
        <Button type="button" variant="outline" size="sm" onClick={addDay} className="border-border bg-card text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add Day
        </Button>
      </div>

      {days.length === 0 && <p className="text-sm text-muted-foreground">No per diem days added yet.</p>}

      {days.map((day, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border border-[#E8EAF0] bg-background p-2">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input type="date" className="mt-1 border-border bg-card" value={day.date || ''} onChange={(e) => updateDay(i, 'date', e.target.value)} />
          </div>
          <div className="w-[130px]">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <ResponsiveSelect value={day.type} onValueChange={(v) => updateDay(i, 'type', v)} options={PER_DIEM_TYPES.map((t) => ({ value: t, label: t }))} triggerClassName="mt-1 border-border bg-card" />
          </div>
          <div className="w-[90px]">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <div className="relative mt-1">
              <span className="absolute left-2.5 top-2 text-xs text-muted-foreground">$</span>
              <Input type="number" readOnly className="border-border bg-[#F0F2F6] pl-6" value={day.amount ?? 0} />
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-600" onClick={() => removeDay(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div>
        <Label className="text-xs text-muted-foreground">Expense Report</Label>
        <div className="mt-1">
          <FileUploadButton label="Upload expense report" file={form.expense_report} onUpload={(f) => set('expense_report', f)} />
        </div>
      </div>

      {days.length > 0 && (
        <div className="flex justify-end border-t border-[#E8EAF0] pt-2">
          <span className="text-sm text-muted-foreground">Per Diem Subtotal: </span>
          <span className="ml-1 text-sm font-semibold text-foreground">{formatCurrency(calcPerDiemTotal(days))}</span>
        </div>
      )}
    </div>
  );
}