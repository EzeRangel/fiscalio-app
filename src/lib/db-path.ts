import path from "path";

export const FISCALIO_DATA_DIR = "FISCALIO_DATA_DIR";

export function resolveDBPath(env: NodeJS.ProcessEnv = process.env): string {
  const fromEnv = env[FISCALIO_DATA_DIR]?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  return path.resolve(process.cwd(), "pglite", "db");
}

export const DB_PATH = resolveDBPath();