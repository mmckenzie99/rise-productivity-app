import { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function FileUploadButton({ label, file, onUpload }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handle = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      onUpload({ name: f.name, url: file_url });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input type="file" ref={inputRef} className="hidden" onChange={handle} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="border-[#D6DAE3] bg-white text-[#1B2A4B]"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : file?.url ? 'Replace' : label}
      </Button>
      {file?.url && (
        <>
          <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#1B2A4B] underline">
            <FileText className="h-3.5 w-3.5" />
            {file.name}
          </a>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpload({ name: '', url: '' })}>
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}