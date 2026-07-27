import DOMPurify from 'dompurify';

export default function RichTextDisplay({ html }) {
  if (!html) return null;
  return (
    <div
      className="rich-notes-display prose-sm"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}