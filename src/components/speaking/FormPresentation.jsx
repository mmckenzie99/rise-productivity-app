import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, FileText } from 'lucide-react';

export default function FormPresentation({ form, set }) {
  return (
    <div className="space-y-4 rounded-lg border border-[#D6DAE3] bg-white p-4">
      <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Presentation</h3>
      <div>
        <Label className="text-xs text-[#5A6781]">Title</Label>
        <Input className="mt-1 border-[#D6DAE3] bg-white" value={form.speaker_name || ''} onChange={e => set('speaker_name', e.target.value)} placeholder="Presentation title" />
      </div>
      <div>
        <Label className="text-xs text-[#5A6781]">Description</Label>
        <Textarea className="mt-1 border-[#D6DAE3] bg-white" value={form.speaker_bio || ''} onChange={e => set('speaker_bio', e.target.value)} placeholder="Presentation description…" />
      </div>
      <div>
        <Label className="text-xs text-[#5A6781]">Presentation file</Label>
        <div className="mt-1 flex items-center gap-2">
          <LinkIcon className="h-4 w-4 shrink-0 text-[#5A6781]" />
          <Input type="url" className="border-[#D6DAE3] bg-white" value={form.presentation_file_url || ''} onChange={e => set('presentation_file_url', e.target.value)} placeholder="https://link-to-presentation-file…" />
        </div>
      </div>
      <div>
        <Label className="text-xs text-[#5A6781]">Presentation Handout</Label>
        <div className="mt-1 flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-[#5A6781]" />
          <Input type="url" className="border-[#D6DAE3] bg-white" value={form.handout_url || ''} onChange={e => set('handout_url', e.target.value)} placeholder="https://link-to-handout…" />
        </div>
      </div>
    </div>
  );
}