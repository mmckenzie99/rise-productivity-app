// Extracts a Zoom meeting URL from a rich-text notes HTML string.
// Handles both <a href="https://...zoom.us/..."> links and bare URL text.
export const ZOOM_URL_RE = /https?:\/\/[^\s"'<>]*zoom\.us[^\s"'<>]*/i;

export function extractZoomUrl(notes) {
  if (!notes) return null;
  const hrefMatch = /href=["'](https?:\/\/[^"']*zoom\.us[^"']*)["']/i.exec(notes);
  if (hrefMatch) return hrefMatch[1].replace(/&amp;/g, '&');
  const m = ZOOM_URL_RE.exec(notes);
  return m ? m[0].replace(/&amp;/g, '&') : null;
}