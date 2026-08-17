import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the app version from a version-bearing file reachable from `cwd`.
 *
 * Order: `schema.json` (standalone build) → `.next/standalone/schema.json`
 * (dev) → `package.json`. Falls back to "1.0.0" so callers never crash.
 */
export function resolveAppVersion(
  fsImpl: Pick<typeof fs, "readFileSync"> = fs,
  cwd: string = process.cwd()
): string {
  const candidates = [
    path.resolve(cwd, "schema.json"),
    path.resolve(cwd, ".next", "standalone", "schema.json"),
    path.resolve(cwd, "package.json"),
  ];

  for (const candidate of candidates) {
    try {
      const raw = fsImpl.readFileSync(candidate, "utf-8");
      const parsed = JSON.parse(raw) as { version?: unknown };
      if (typeof parsed.version === "string" && parsed.version.trim()) {
        return parsed.version.trim();
      }
    } catch {
      // fall through to the next candidate
    }
  }

  return "1.0.0";
}