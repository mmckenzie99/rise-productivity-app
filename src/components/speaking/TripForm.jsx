import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ResponsiveSelect from './ResponsiveSelect';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import { DEPARTMENTS, defaultTrip, calcPerDiemTotal, calcTotalCost, calcTravelTotal, calcLodgingTotal, formatCurrency } from '@/lib/trips';
import FormTravel from './FormTravel';
import FormPerDiem from './FormPerDiem';
import FormLodging from './FormLodging';
import MultiTypeSelect from './MultiTypeSelect';
import ShareToggle from './ShareToggle';

export default function TripForm({ open, item, engagements, onClose, onSave }) {
  const [form, setForm] = useState(defaultTrip);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(item ? { ...defaultTrip, ...item, place: Array.isArray(item.place) ? item.place : (item.place ? [item.place] : []) } : { ...defaultTrip });
    }
  }, [open, item]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const placeOptions = useMemo(() => Object.values((engagements || []).reduce((acc, e) => {
    const p = (e.place || '').trim().replace(/\.+$/, '').trim();
    if (!p) return acc;
    const key = p.toLowerCase();
    if (!acc[key]) acc[key] = p;
    return acc;
  }, {})), [engagements]);

  const travelTotal = calcTravelTotal(form.travel_entries);
  const lodgingTotal = calcLodgingTotal(form.lodging_entries);
  const totalPerDiem = calcPerDiemTotal(form.per_diem_days);
  const totalCost = calcTotalCost(travelTotal, totalPerDiem, lodgingTotal);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({
      ...form,
      total_per_diem: totalPerDiem,
      total_cost: totalCost
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:max-h-[90dvh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
          <DialogTitle className="font-display">{item ? 'Edit Trip Details' : 'New Trip Details'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5">
          {/* Linked Engagement */}
          <MultiTypeSelect label="Places" values={form.place} options={placeOptions} onChange={(v) => set('place', v)} />

          {/* Department */}
          <div>
            <Label className="text-xs text-muted-foreground">Department</Label>
            <ResponsiveSelect value={form.department || ''} onValueChange={(v) => set('department', v)} options={DEPARTMENTS.map((d) => ({ value: d, label: d }))} placeholder="Select department" triggerClassName="mt-1 border-border bg-card" />
          </div>

          {/* Travel Schedule */}
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Travel Schedule</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Leave Date</Label>
                <DatePicker value={form.leave_date || ''} onChange={(v) => set('leave_date', v)} className="mt-1 border-border bg-card" label="Leave Date" />
              </div>
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Leave Time</Label>
                <TimePicker value={form.leave_time || ''} onChange={(v) => set('leave_time', v)} className="mt-1 border-border bg-card" label="Leave Time" />
              </div>
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Return Date</Label>
                <DatePicker value={form.return_date || ''} onChange={(v) => set('return_date', v)} className="mt-1 border-border bg-card" label="Return Date" />
              </div>
              <div className="min-w-0">
                <Label className="text-xs text-muted-foreground">Return Time</Label>
                <TimePicker value={form.return_time || ''} onChange={(v) => set('return_time', v)} className="mt-1 border-border bg-card" label="Return Time" />
              </div>
            </div>
          </div>

          <ShareToggle value={form.is_shared} onChange={(v) => set('is_shared', v)} />

          <FormTravel form={form} set={set} />
          <FormLodging form={form} set={set} />
          <FormPerDiem form={form} set={set} />

          {/* Totals */}
          <div className="flex justify-between rounded-lg bg-[#1B2A4B] px-4 py-3 text-white">
            <span className="text-sm font-medium">Total Cost (Travel + Lodging + Per Diem)</span>
            <span className="font-display text-lg font-semibold text-[#D9A404]">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Button variant="outline" onClick={onClose} className="border-border bg-card">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.place.length || !form.department} className="bg-[#D9A404] hover:bg-[#B89003]">
            {saving ? 'Saving…' : 'Save Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}