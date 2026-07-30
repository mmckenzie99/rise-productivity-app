import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Paperclip, X } from 'lucide-react';

export default function FormAttachments({ form, set }) {
  const [loading, setLoading] = useState(false);
  const list = form.attachments || [];
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('attachments', [...list, { name: file.name, url: file_url, kind: 'file' }]);
    setLoading(false);
  };
  return (
    <div className="space-y-3 rounded-lg border border-[#D6DAE3] bg-white p-4">
      <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Attachments</h3>
      <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#D9A404] p-4 text-sm text-[#5A6781]">
        <Input type="file" className="hidden" onChange={upload} />
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
        Add a file
      </label>
      <div className="space-y-1">
        {list.map((a, i) => (
          <div key={`${a.name}-${i}`} className="flex items-center gap-2 rounded bg-[#F7F8FA] px-3 py-2 text-xs">
            <a className="min-w-0 flex-1 truncate hover:underline" href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
            <Button type="button" size="icon" variant="ghost" onClick={() => set('attachments', list.filter((_, n) => n !== i))}><X className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}