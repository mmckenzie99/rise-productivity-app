import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function FormBasics({ form, set }) {
  return (
    <div className="space-y-4 rounded-lg border border-[#D6DAE3] bg-white p-4">
      <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Basics</h3>
      <div>
        <Label className="text-xs text-[#5A6781]">Place</Label>
        <Input className="mt-1 border-[#D6DAE3] bg-white" value={form.place || ''} onChange={e => set('place', e.target.value)} placeholder="e.g. Houston, TX or Main Campus" />
      </div>
      <div>
        <Label className="text-xs text-[#5A6781]">Purpose</Label>
        <Textarea className="mt-1 border-[#D6DAE3] bg-white" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="General purpose of this engagement…" />
      </div>
    </div>
  );
}