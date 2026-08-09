import DOMPurify from 'dompurify';

const URL_RE = /https?:\/\/[^\s<>"']+/gi;

// After sanitizing: (1) make every existing anchor open in a new tab safely,
// and (2) wrap bare URLs in text nodes (notes saved before auto-linking) into
// real <a> tags so they render as clickable links everywhere notes are shown.
function enhanceLinks(container) {
  container.querySelectorAll('a').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const targets = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && node.parentElement.closest('a')) continue;
    URL_RE.lastIndex = 0;
    if (URL_RE.test(node.nodeValue)) targets.push(node);
  }

  targets.forEach((tn) => {
    const text = tn.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0;
    URL_RE.lastIndex = 0;
    let m;
    while ((m = URL_RE.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const a = document.createElement('a');
      a.href = m[0];
      a.textContent = m[0];
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      frag.appendChild(a);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    tn.parentNode.replaceChild(frag, tn);
  });
}

export default function RichTextDisplay({ html }) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
  let out = clean;
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = clean;
    enhanceLinks(tmp);
    out = tmp.innerHTML;
  }
  return <div className="rich-notes-display prose-sm" dangerouslySetInnerHTML={{ __html: out }} />;
}