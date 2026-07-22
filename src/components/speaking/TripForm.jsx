import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, defaultTrip, calcPerDiemTotal, calcTotalCost, formatCurrency } from '@/lib/trips';
import FormTravel from './FormTravel';
import FormPerDiem from './FormPerDiem';

export default function TripForm({ open, item, engagements, onClose, onSave }) {
  const [form, setForm] = useState(defaultTrip);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(item ? { ...defaultTrip, ...item } : { ...defaultTrip });
    }
  }, [open, item]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const totalPerDiem = calcPerDiemTotal(form.per_diem_days);
  const totalCost = calcTotalCost(form.travel_cost, totalPerDiem);

  const handleSubmit = async () => {
    setSaving(true);
    const eng = engagements.find((e) => e.id === form.engagement_id);
    await onSave({
      ...form,
      engagement_title: eng?.title || '',
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
          <div>
            <Label className="text-xs text-[#5A6781]">Linked Engagement</Label>
            <Select value={form.engagement_id || ''} onValueChange={(v) => set('engagement_id', v)}>
              <SelectTrigger className="mt-1 border-[#D6DAE3] bg-white"><SelectValue placeholder="Select an engagement" /></SelectTrigger>
              <SelectContent>
                {engagements.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div>
            <Label className="text-xs text-[#5A6781]">Department</Label>
            <Select value={form.department || ''} onValueChange={(v) => set('department', v)}>
              <SelectTrigger className="mt-1 border-[#D6DAE3] bg-white"><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Travel Schedule */}
          <div className="space-y-3 rounded-lg border border-[#D6DAE3] bg-white p-4">
            <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Travel Schedule</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#5A6781]">Leave Date</Label>
                <Input type="date" className="mt-1 border-[#D6DAE3] bg-white" value={form.leave_date || ''} onChange={(e) => set('leave_date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-[#5A6781]">Leave Time</Label>
                <Input type="time" className="mt-1 border-[#D6DAE3] bg-white" value={form.leave_time || ''} onChange={(e) => set('leave_time', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-[#5A6781]">Return Date</Label>
                <Input type="date" className="mt-1 border-[#D6DAE3] bg-white" value={form.return_date || ''} onChange={(e) => set('return_date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-[#5A6781]">Return Time</Label>
                <Input type="time" className="mt-1 border-[#D6DAE3] bg-white" value={form.return_time || ''} onChange={(e) => set('return_time', e.target.value)} />
              </div>
            </div>
          </div>

          <FormTravel form={form} set={set} />
          <FormPerDiem form={form} set={set} />

          {/* Totals */}
          <div className="flex justify-between rounded-lg bg-[#1B2A4B] px-4 py-3 text-white">
            <span className="text-sm font-medium">Total Cost (Travel + Per Diem)</span>
            <span className="font-display text-lg font-semibold text-[#D9A404]">{formatCurrency(totalCost)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#D6DAE3] bg-white">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.engagement_id || !form.department} className="bg-[#D9A404] hover:bg-[#B89003]">
            {saving ? 'Saving…' : 'Save Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}