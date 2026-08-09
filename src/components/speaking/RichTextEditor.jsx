import { useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const URL_RE = /https?:\/\/[^\s<>"']+/gi;

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    ['link'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean']
  ]
};

// Auto-linkify URLs typed or pasted into the editor. Runs only on user-driven
// changes; formatting is applied with source 'api' so it does not re-trigger
// the handler (the follow-up pass finds the URL already linked and no-ops).
function linkifyQuill(quill) {
  const text = quill.getText();
  URL_RE.lastIndex = 0;
  const ranges = [];
  let m;
  while ((m = URL_RE.exec(text))) {
    const fmt = quill.getFormat(m.index, m[0].length);
    if (!fmt || !fmt.link) ranges.push({ index: m.index, length: m[0].length, url: m[0] });
  }
  for (let i = ranges.length - 1; i >= 0; i--) {
    const { index, length, url } = ranges[i];
    quill.formatText(index, length, 'link', url, 'api');
  }
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);
  const applying = useRef(false);

  const handleChange = (content, delta, source) => {
    onChange(content);
    if (source !== 'user' || applying.current) return;
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    applying.current = true;
    try {
      linkifyQuill(quill);
    } finally {
      applying.current = false;
    }
  };

  // Clicking a link inside the editor opens it in a new tab.
  const handleClick = (e) => {
    const a = e.target.closest('a');
    if (a && a.getAttribute('href')) {
      e.preventDefault();
      e.stopPropagation();
      window.open(a.getAttribute('href'), '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="rich-notes" onClick={handleClick}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        placeholder={placeholder || ''}
      />
    </div>
  );
}