import path from "path";
import { FISCALIO_DATA_DIR, resolveDBPath } from "./db-path";

describe("resolveDBPath", () => {
  it("should fall back to cwd/pglite/db when env var is not set", () => {
    expect(resolveDBPath({})).toBe(
      path.resolve(process.cwd(), "pglite", "db")
    );
  });

  it("should use FISCALIO_DATA_DIR when set", () => {
    const env = { [FISCALIO_DATA_DIR]: "/tmp/fiscalio-data" };
    expect(resolveDBPath(env)).toBe(path.resolve("/tmp/fiscalio-data"));
  });

  it("should resolve relative env paths against cwd", () => {
    const env = { [FISCALIO_DATA_DIR]: "./data/fiscalio" };
    expect(resolveDBPath(env)).toBe(
      path.resolve(process.cwd(), "data", "fiscalio")
    );
  });

  it("should ignore an empty string value", () => {
    const env = { [FISCALIO_DATA_DIR]: "" };
    expect(resolveDBPath(env)).toBe(
      path.resolve(process.cwd(), "pglite", "db")
    );
  });

  it("should ignore a whitespace-only value", () => {
    const env = { [FISCALIO_DATA_DIR]: "   " };
    expect(resolveDBPath(env)).toBe(
      path.resolve(process.cwd(), "pglite", "db")
    );
  });
});
