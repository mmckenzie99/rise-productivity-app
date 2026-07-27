const SCRIPT_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE', 'FORM']);

function sanitize(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  doc.querySelectorAll(Array.from(SCRIPT_TAGS).join(',')).forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

export default function RichTextDisplay({ html }) {
  if (!html) return null;
  return (
    <div
      className="rich-notes-display prose-sm"
      dangerouslySetInnerHTML={{ __html: sanitize(html) }}
    />
  );
}