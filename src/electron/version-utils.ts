/**
 * Compares two dotted numeric version strings (e.g. "1.0.0" vs "1.0.1").
 * Leading "v" prefixes and patch suffixes are tolerated.
 */
export function versionGreater(a: string, b: string): boolean {
  const clean = (v: string) => v.trim().toLowerCase().replace(/^v/, "");
  const na = clean(a).split(/[.-]/).map((part) => {
    const n = Number(part);
    return Number.isNaN(n) ? 0 : n;
  });
  const nb = clean(b).split(/[.-]/).map((part) => {
    const n = Number(part);
    return Number.isNaN(n) ? 0 : n;
  });

  for (let i = 0; i < Math.max(na.length, nb.length); i++) {
    const lhs = na[i] ?? 0;
    const rhs = nb[i] ?? 0;
    if (lhs > rhs) return true;
    if (lhs < rhs) return false;
  }
  return false;
}