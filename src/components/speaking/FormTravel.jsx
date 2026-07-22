import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TRAVEL_TYPES } from '@/lib/trips';
import FileUploadButton from './FileUploadButton';

export default function FormTravel({ form, set }) {
  return (
    <div className="space-y-3 rounded-lg border border-[#D6DAE3] bg-white p-4">
      <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Travel Details</h3>

      <div>
        <Label className="text-xs text-[#5A6781]">Type of Travel</Label>
        <Select value={form.travel_type || ''} onValueChange={(v) => set('travel_type', v)}>
          <SelectTrigger className="mt-1 border-[#D6DAE3] bg-white"><SelectValue placeholder="Select travel type" /></SelectTrigger>
          <SelectContent>
            {TRAVEL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {form.travel_type === 'Flight' && (
        <div>
          <Label className="text-xs text-[#5A6781]">Airline</Label>
          <Input className="mt-1 border-[#D6DAE3] bg-white" value={form.airline || ''} onChange={(e) => set('airline', e.target.value)} placeholder="e.g. Delta" />
        </div>
      )}

      {form.travel_type === 'Rental' && (
        <div>
          <Label className="text-xs text-[#5A6781]">Rental Company</Label>
          <Input className="mt-1 border-[#D6DAE3] bg-white" value={form.rental_company || ''} onChange={(e) => set('rental_company', e.target.value)} placeholder="e.g. Enterprise" />
        </div>
      )}

      <div>
        <Label className="text-xs text-[#5A6781]">Cost</Label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-2 text-sm text-[#5A6781]">$</span>
          <Input type="number" min="0" step="0.01" className="border-[#D6DAE3] bg-white pl-7" value={form.travel_cost ?? ''} onChange={(e) => set('travel_cost', e.target.value === '' ? 0 : Number(e.target.value))} />
        </div>
      </div>

      <div>
        <Label className="text-xs text-[#5A6781]">Receipt</Label>
        <div className="mt-1">
          <FileUploadButton label="Upload receipt" file={form.travel_receipt} onUpload={(f) => set('travel_receipt', f)} />
        </div>
      </div>
    </div>
  );
}