import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';

export default function FormLocation({ form, set }) {
  const [finding, setFinding] = useState(false);
  const find = async () => {
    if (!form.address) return;
    setFinding(true);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(form.address)}`);
    const d = await r.json();
    if (d[0]) { set('latitude', d[0].lat); set('longitude', d[0].lon); }
    setFinding(false);
  };
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">Location</h3>
      <div>
        <Label className="text-xs text-muted-foreground">Address</Label>
        <div className="mt-1 flex gap-2">
          <Input className="border-border bg-card" value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City" />
          <Button type="button" variant="outline" className="border-border bg-card" onClick={find} disabled={finding}>
            {finding ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Latitude</Label>
          <Input type="number" step="any" className="mt-1 border-border bg-card" value={form.latitude ?? ''} onChange={e => set('latitude', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Longitude</Label>
          <Input type="number" step="any" className="mt-1 border-border bg-card" value={form.longitude ?? ''} onChange={e => set('longitude', e.target.value)} />
        </div>
      </div>
    </div>
  );
}