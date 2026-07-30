import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, X } from 'lucide-react';

export default function FormSpeaker({ form, set }) {
  const [loading, setLoading] = useState(false);
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('speaker_photo', file_url);
    setLoading(false);
  };
  return (
    <div className="space-y-4 rounded-lg border border-[#D6DAE3] bg-white p-4">
      <h3 className="font-display text-sm font-semibold text-[#1B2A4B]">Speaker</h3>
      <div>
        <Label className="text-xs text-[#5A6781]">Speaker name</Label>
        <Input className="mt-1 border-[#D6DAE3] bg-white" value={form.speaker_name || ''} onChange={e => set('speaker_name', e.target.value)} placeholder="Full name" />
      </div>
      <div>
        <Label className="text-xs text-[#5A6781]">Speaker bio</Label>
        <Textarea className="mt-1 border-[#D6DAE3] bg-white" value={form.speaker_bio || ''} onChange={e => set('speaker_bio', e.target.value)} placeholder="Short bio or credentials…" />
      </div>
      <div>
        <Label className="text-xs text-[#5A6781]">Speaker photo</Label>
        {form.speaker_photo ? (
          <div className="mt-1 flex items-center gap-3">
            <Image src={form.speaker_photo} alt="Speaker" className="h-20 w-20 overflow-hidden rounded-full" />
            <Button type="button" variant="outline" className="border-[#D6DAE3] bg-white" size="sm" onClick={() => set('speaker_photo', '')}><X className="mr-1 h-3.5 w-3.5" />Remove</Button>
          </div>
        ) : (
          <label className="mt-1 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#D9A404] p-4 text-sm text-[#5A6781]">
            <Input type="file" accept="image/*" className="hidden" onChange={upload} />
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload photo
          </label>
        )}
      </div>
    </div>
  );
}