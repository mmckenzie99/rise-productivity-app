import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EMPTY, asArray } from '@/lib/speaking';
import { useImportantFlags } from '@/lib/ImportantFlagsProvider';
import { syncFollowUpFlag } from '@/lib/followUpFlag';
import FormBasics from './FormBasics';
import FormSchedule from './FormSchedule';
import FormLocation from './FormLocation';
import FormPresentation from './FormPresentation';
import RichTextEditor from './RichTextEditor';
import ShareToggle from './ShareToggle';

export default function EngagementForm({ open, item, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [flagForFollowUp, setFlagForFollowUp] = useState(false);
  const { flaggedKeys, load: loadFlags } = useImportantFlags();
  const flaggedKeysRef = useRef(flaggedKeys);
  flaggedKeysRef.current = flaggedKeys;

  useEffect(() => {
    setForm(item ? { ...EMPTY, ...item, presentation_type: asArray(item.presentation_type) } : EMPTY);
    setFlagForFollowUp(item ? flaggedKeysRef.current.has(`Engagement:${item.id}`) : false);
  }, [item, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    const saved = await onSave(form);
    const id = saved?.id || form.id;
    if (id) {
      await syncFollowUpFlag('Engagement', id, flagForFollowUp, form.title || form.speaker_name || 'Engagement', form.speaking_date);
      await loadFlags();
    }
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="flex inset-0 max-h-none max-w-none flex-col overflow-hidden gap-0 p-0 bg-card translate-x-0 translate-y-0 rounded-none sm:top-[50%] sm:left-[50%] sm:right-auto sm:bottom-auto sm:max-h-[90dvh] sm:max-w-2xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3">
          <DialogTitle className="font-display text-2xl">{item ? 'Edit Engagement Details' : 'New Engagement Details'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-5">
          <FormBasics form={form} set={set} />
          <FormSchedule form={form} set={set} />
          <FormPresentation form={form} set={set} />
          <FormLocation form={form} set={set} />

          <ShareToggle value={form.is_shared} onChange={(v) => set('is_shared', v)} />

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground">Flag for follow-up</h3>
              <Label className="text-xs text-muted-foreground">Pins this engagement in the Inbox for follow-up.</Label>
            </div>
            <Switch checked={flagForFollowUp} onCheckedChange={setFlagForFollowUp} />
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <h3 className="font-display text-sm font-semibold text-foreground">Notes</h3>
            <Label className="text-xs text-muted-foreground">Preparation notes, ideas, and reminders</Label>
            <RichTextEditor value={form.notes || ''} onChange={v => set('notes', v)} placeholder="Preparation notes, ideas, and reminders…" />
          </div>

        </div>

        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" onClick={onClose} className="border-border bg-card">Cancel</Button>
          <Button type="button" onClick={submit} disabled={saving} className="bg-[#D9A404] hover:bg-[#B89003]">
            {saving ? 'Saving…' : 'Save Engagement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}