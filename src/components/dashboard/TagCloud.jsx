import { cn } from '@/lib/utils';

// Renders a list of items as clickable pill tags. Purely presentational —
// the parent owns selection and the dialog that opens on click.
//
// Props:
//   items       - array of records
//   getLabel    - (item) => string shown in the tag
//   getKey      - (item) => stable key
//   getTone     - (item) => Tailwind class string for the pill (bg/text/border)
//   onSelect     - (item) => void  called when a tag is tapped
//   emptyText   - string shown when there are no items
export default function TagCloud({ items, getLabel, getKey, getTone, onSelect, emptyText = 'No items.' }) {
  if (!items || items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
        {emptyText}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={getKey(item)}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            'inline-flex max-w-[220px] items-center rounded-full border px-3 py-1.5 text-xs font-medium transition hover:shadow-sm',
            getTone(item)
          )}
        >
          <span className="truncate">{getLabel(item)}</span>
        </button>
      ))}
    </div>
  );
}