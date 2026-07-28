// Assigns side-by-side columns to overlapping timed events so concurrent
// plans remain visible instead of stacking on top of each other.
// Each item must carry _sMin / _eMin (start/end in minutes). Output augments
// each item with _col (0-based column index) and _totalCols (columns in its cluster).
export function layoutColumns(items) {
  if (!items || items.length === 0) return [];

  const sorted = [...items].sort(
    (a, b) => a._sMin - b._sMin || (b._eMin - b._sMin) - (a._eMin - a._sMin)
  );

  // Group into clusters of mutually overlapping events.
  const clusters = [];
  let current = [];
  let clusterEnd = -Infinity;
  for (const ev of sorted) {
    if (current.length && ev._sMin >= clusterEnd) {
      clusters.push(current);
      current = [];
    }
    current.push(ev);
    clusterEnd = Math.max(clusterEnd, ev._eMin);
  }
  if (current.length) clusters.push(current);

  const result = [];
  for (const cluster of clusters) {
    const cols = []; // cols[i] = end time of last event placed in column i
    const assign = [];
    for (const ev of cluster) {
      let col = cols.findIndex((end) => end <= ev._sMin);
      if (col === -1) {
        col = cols.length;
        cols.push(ev._eMin);
      } else {
        cols[col] = ev._eMin;
      }
      assign.push({ ev, col });
    }
    const totalCols = Math.max(...assign.map((a) => a.col)) + 1;
    for (const { ev, col } of assign) {
      result.push({ ...ev, _col: col, _totalCols: totalCols });
    }
  }
  return result;
}