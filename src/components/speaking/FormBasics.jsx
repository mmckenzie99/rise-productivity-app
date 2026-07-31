import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function FormBasics({ form, set }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">Basics</h3>
      <div>
        <Label className="text-xs text-muted-foreground">Place</Label>
        <Input className="mt-1 border-border bg-card" value={form.place || ''} onChange={e => set('place', e.target.value)} placeholder="e.g. Houston, TX or Main Campus" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Purpose</Label>
        <Textarea className="mt-1 border-border bg-card" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="General purpose of this engagement…" />
      </div>
    </div>
  );
}