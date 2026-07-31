import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, FileText } from 'lucide-react';

export default function FormPresentation({ form, set }) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">Presentation Files</h3>
      <div>
        <Label className="text-xs text-muted-foreground">Presentation file</Label>
        <div className="mt-1 flex items-center gap-2">
          <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input type="url" className="border-border bg-card" value={form.presentation_file_url || ''} onChange={e => set('presentation_file_url', e.target.value)} placeholder="https://link-to-presentation-file…" />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Presentation Handout</Label>
        <div className="mt-1 flex items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input type="url" className="border-border bg-card" value={form.handout_url || ''} onChange={e => set('handout_url', e.target.value)} placeholder="https://link-to-handout…" />
        </div>
      </div>
    </div>
  );
}