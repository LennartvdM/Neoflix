/**
 * Layout: turn the modules a record called for into rows.
 *
 * Modules arrive sorted by `order`. They fill rows of twelve columns; a
 * row that can't take the next module is closed, and its last module
 * stretches to fill it, so rows never end ragged. A `tall` module (a long
 * checklist, the toolbox text) takes a column of the narrow modules
 * beside it — the ones already waiting in its row, then the next narrow
 * ones — instead of leaving a hole next to itself.
 *
 * Pure and Node-safe: system-check.mjs asserts every row sums to twelve.
 *
 * Returns items: { module, span } or { stack: [module…], span }.
 */
export const COLUMNS = 12;
const NARROW = 5;

export function assemble(modules) {
  const mods = [...modules].sort((a, b) => a.order - b.order);
  const items = [];
  let row = [];
  let used = 0;
  const close = () => {
    if (row.length) row[row.length - 1].span += COLUMNS - used;
    items.push(...row);
    row = [];
    used = 0;
  };
  for (let i = 0; i < mods.length; i++) {
    const m = mods[i];
    if (m.tall) {
      const side = COLUMNS - m.span;
      // What's waiting in the row joins the side column only if it fits
      // there; a full or wide row is closed first.
      if (row.some((x) => x.span > NARROW) || used > side) close();
      const before = row.length > 0;
      const stack = row.splice(0).map((x) => x.module);
      used = 0;
      for (let j = i + 1; j < mods.length && stack.length < 3; ) {
        if (!mods[j].tall && mods[j].span <= NARROW) stack.push(mods.splice(j, 1)[0]);
        else j++;
      }
      if (!stack.length) items.push({ module: m, span: COLUMNS });
      else {
        const group = { stack, span: side };
        items.push(...(before ? [group, { module: m, span: m.span }] : [{ module: m, span: m.span }, group]));
      }
      continue;
    }
    if (used + m.span > COLUMNS) close();
    row.push({ module: m, span: m.span });
    used += m.span;
  }
  close();
  return items;
}

/** Every row of `items` sums to twelve (for the checks). */
export function rowsOf(items) {
  const rows = [];
  let row = [];
  let used = 0;
  for (const it of items) {
    if (used + it.span > COLUMNS) { rows.push(row); row = []; used = 0; }
    row.push(it);
    used += it.span;
    if (used === COLUMNS) { rows.push(row); row = []; used = 0; }
  }
  if (row.length) rows.push(row);
  return rows;
}
