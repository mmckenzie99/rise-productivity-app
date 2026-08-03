import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import ResponsiveSelect from './ResponsiveSelect';
import { DEPARTMENTS, defaultTrip, calcPerDiemTotal, calcTotalCost, calcTravelTotal, calcLodgingTotal, formatCurrency } from '@/lib/trips';
import FormTravel from './FormTravel';
import FormPerDiem from './FormPerDiem';
import FormLodging from './FormLodging';
import MultiTypeSelect from './MultiTypeSelect';

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{item ? 'Edit Trip Details' : 'New Trip Details'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
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
              <div>
                <Label className="text-xs text-muted-foreground">Leave Date</Label>
                <Input type="date" className="mt-1 border-border bg-card" value={form.leave_date || ''} onChange={(e) => set('leave_date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Leave Time</Label>
                <Input type="time" className="mt-1 border-border bg-card" value={form.leave_time || ''} onChange={(e) => set('leave_time', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Return Date</Label>
                <Input type="date" className="mt-1 border-border bg-card" value={form.return_date || ''} onChange={(e) => set('return_date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Return Time</Label>
                <Input type="time" className="mt-1 border-border bg-card" value={form.return_time || ''} onChange={(e) => set('return_time', e.target.value)} />
              </div>
            </div>
          </div>

          <FormTravel form={form} set={set} />
          <FormLodging form={form} set={set} />
          <FormPerDiem form={form} set={set} />

          {/* Totals */}
          <div className="flex justify-between rounded-lg bg-[#1B2A4B] px-4 py-3 text-white">
            <span className="text-sm font-medium">Total Cost (Travel + Lodging + Per Diem)</span>
            <span className="font-display text-lg font-semibold text-[#D9A404]">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border bg-card">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.place.length || !form.department} className="bg-[#D9A404] hover:bg-[#B89003]">
            {saving ? 'Saving…' : 'Save Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}