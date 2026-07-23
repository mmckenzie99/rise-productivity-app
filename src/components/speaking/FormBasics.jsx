import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function FormBasics({ form, set }) {
  return (
    <>
      <div>
        <Label>Place</Label>
        <Input value={form.place || ''} onChange={e => set('place', e.target.value)} placeholder="e.g. Houston, TX or Main Campus" />
      </div>
      <div>
        <Label>Purpose</Label>
        <Textarea value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="General purpose of this engagement…" />
      </div>
    </>
  );
}