import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EMPTY, asArray } from '@/lib/speaking';
import FormBasics from './FormBasics';
import FormSchedule from './FormSchedule';
import FormLocation from './FormLocation';
import FormAttachments from './FormAttachments';
import FormPresentation from './FormPresentation';
import RichTextEditor from './RichTextEditor';
import useHistoryModal from '@/hooks/useHistoryModal';

export default function EngagementForm({ open, item, onClose, onSave }) {
  const requestClose = useHistoryModal(open, onClose);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(item ? { ...EMPTY, ...item, presentation_type: asArray(item.presentation_type) } : EMPTY);
  }, [item, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    requestClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && requestClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{item ? 'Edit Engagement Details' : 'New Engagement Details'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <FormBasics form={form} set={set} />
          <FormSchedule form={form} set={set} />
          <FormPresentation form={form} set={set} />
          <FormLocation form={form} set={set} />

          <div className="space-y-2 rounded-lg border border-[#D6DAE3] bg-white p-4">
            <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Notes</h3>
            <Label className="text-xs text-[#5A6781]">Preparation notes, ideas, and reminders</Label>
            <RichTextEditor value={form.notes || ''} onChange={v => set('notes', v)} placeholder="Preparation notes, ideas, and reminders…" />
          </div>

          <FormAttachments form={form} set={set} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={requestClose} className="border-[#D6DAE3] bg-white">Cancel</Button>
          <Button type="button" onClick={submit} disabled={saving} className="bg-[#D9A404] hover:bg-[#B89003]">
            {saving ? 'Saving…' : 'Save Engagement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}