import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { TRAVEL_TYPES, defaultTravelEntry, calcTravelTotal, formatCurrency } from '@/lib/trips';
import FileUploadButton from './FileUploadButton';

export default function FormTravel({ form, set }) {
  const entries = form.travel_entries || [];

  const addEntry = () => set('travel_entries', [...entries, defaultTravelEntry()]);
  const removeEntry = (i) => set('travel_entries', entries.filter((_, idx) => idx !== i));
  const updateEntry = (i, key, val) => {
    const next = [...entries];
    next[i] = { ...next[i], [key]: val };
    set('travel_entries', next);
  };

  return (
    <div className="space-y-3 rounded-lg border border-[#D6DAE3] bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Travel Details</h3>
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="border-[#D6DAE3] bg-white text-[#1B2A4B]">
          <Plus className="h-3.5 w-3.5" /> Add Travel
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-[#5A6781]">Departure Airport</Label>
          <Input className="mt-1 border-[#D6DAE3] bg-white" value={form.departure_airport || ''} onChange={(e) => set('departure_airport', e.target.value)} placeholder="e.g. DTW - Detroit" />
        </div>
        <div>
          <Label className="text-xs text-[#5A6781]">Rental Pickup Location</Label>
          <Input className="mt-1 border-[#D6DAE3] bg-white" value={form.rental_pickup_location || ''} onChange={(e) => set('rental_pickup_location', e.target.value)} placeholder="e.g. Enterprise - Airport" />
        </div>
      </div>

      {entries.length === 0 && <p className="text-sm text-[#5A6781]">No travel entries added yet. Click "Add Travel" to add a flight, rental, or personal auto.</p>}

      {entries.map((entry, i) => (
        <div key={i} className="space-y-3 rounded-md border border-[#E8EAF0] bg-[#F7F8FA] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#5A6781]">Travel {i + 1}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-[#5A6781] hover:text-red-600" onClick={() => removeEntry(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div>
            <Label className="text-xs text-[#5A6781]">Type of Travel</Label>
            <Select value={entry.type || ''} onValueChange={(v) => updateEntry(i, 'type', v)}>
              <SelectTrigger className="mt-1 border-[#D6DAE3] bg-white"><SelectValue placeholder="Select travel type" /></SelectTrigger>
              <SelectContent>
                {TRAVEL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {entry.type === 'Flight' && (
            <div>
              <Label className="text-xs text-[#5A6781]">Airline</Label>
              <Input className="mt-1 border-[#D6DAE3] bg-white" value={entry.airline || ''} onChange={(e) => updateEntry(i, 'airline', e.target.value)} placeholder="e.g. Delta" />
            </div>
          )}

          {entry.type === 'Rental' && (
            <div>
              <Label className="text-xs text-[#5A6781]">Rental Company</Label>
              <Input className="mt-1 border-[#D6DAE3] bg-white" value={entry.rental_company || ''} onChange={(e) => updateEntry(i, 'rental_company', e.target.value)} placeholder="e.g. Enterprise" />
            </div>
          )}

          <div>
            <Label className="text-xs text-[#5A6781]">Cost</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-2 text-sm text-[#5A6781]">$</span>
              <Input type="number" min="0" step="0.01" className="border-[#D6DAE3] bg-white pl-7" value={entry.cost ?? ''} onChange={(e) => updateEntry(i, 'cost', e.target.value === '' ? 0 : Number(e.target.value))} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#5A6781]">Receipt</Label>
            <div className="mt-1">
              <FileUploadButton label="Upload receipt" file={entry.receipt} onUpload={(f) => updateEntry(i, 'receipt', f)} />
            </div>
          </div>
        </div>
      ))}

      {entries.length > 0 && (
        <div className="flex justify-end border-t border-[#E8EAF0] pt-2">
          <span className="text-sm text-[#5A6781]">Travel Subtotal: </span>
          <span className="ml-1 text-sm font-semibold text-[#1B2A4B]">{formatCurrency(calcTravelTotal(entries))}</span>
        </div>
      )}
    </div>
  );
}