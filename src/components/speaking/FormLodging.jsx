import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { defaultLodgingEntry, calcLodgingTotal, formatCurrency } from '@/lib/trips';
import FileUploadButton from './FileUploadButton';

export default function FormLodging({ form, set }) {
  const entries = form.lodging_entries || [];

  const addEntry = () => set('lodging_entries', [...entries, defaultLodgingEntry()]);
  const removeEntry = (i) => set('lodging_entries', entries.filter((_, idx) => idx !== i));
  const updateEntry = (i, key, val) => {
    const next = [...entries];
    next[i] = { ...next[i], [key]: val };
    set('lodging_entries', next);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Lodging Details</h3>
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="border-border bg-card text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add Lodging
        </Button>
      </div>

      {entries.length === 0 && <p className="text-sm text-muted-foreground">No lodging entries added yet. Click "Add Lodging" to add a hotel or lodging place.</p>}

      {entries.map((entry, i) => (
        <div key={i} className="space-y-3 rounded-md border border-[#E8EAF0] bg-background p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Lodging {i + 1}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-600" onClick={() => removeEntry(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Lodging Name</Label>
            <Input className="mt-1 border-border bg-card" value={entry.name || ''} onChange={(e) => updateEntry(i, 'name', e.target.value)} placeholder="e.g. Chicago Marriott Downtown" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0">
            <div>
              <Label className="text-xs text-muted-foreground">Check-in</Label>
              <Input type="date" className="mt-1 border-border bg-card" value={entry.check_in_date || ''} onChange={(e) => updateEntry(i, 'check_in_date', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Check-out</Label>
              <Input type="date" className="mt-1 border-border bg-card" value={entry.check_out_date || ''} onChange={(e) => updateEntry(i, 'check_out_date', e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Cost</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
              <Input type="number" min="0" step="0.01" className="border-border bg-card pl-7" value={entry.cost ?? ''} onChange={(e) => updateEntry(i, 'cost', e.target.value === '' ? 0 : Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Receipt</Label>
            <div className="mt-1">
              <FileUploadButton label="Upload receipt" file={entry.receipt} onUpload={(f) => updateEntry(i, 'receipt', f)} />
            </div>
          </div>
        </div>
      ))}

      {entries.length > 0 && (
        <div className="flex justify-end border-t border-[#E8EAF0] pt-2">
          <span className="text-sm text-muted-foreground">Lodging Subtotal: </span>
          <span className="ml-1 text-sm font-semibold text-foreground">{formatCurrency(calcLodgingTotal(entries))}</span>
        </div>
      )}
    </div>
  );
}