import {
  checkSchemaCompatibility,
  ensureSchemaVersionTable,
  DowngradeDetectedError,
} from "@/lib/schema-gate";

describe("Schema Upgrade / Downgrade Gate", () => {
  it("should create schema_version table and record initial migration count", async () => {
    const mockPg = {
      exec: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // initial select: no version recorded
        .mockResolvedValueOnce({ rows: [{ migration_count: 20 }] }), // insert/update
    };

    await ensureSchemaVersionTable(mockPg as any);
    expect(mockPg.exec).toHaveBeenCalledWith(expect.stringContaining("CREATE SCHEMA IF NOT EXISTS app_meta"));

    const result = await checkSchemaCompatibility(mockPg as any, 20, "0.1.0");
    expect(result.allowed).toBe(true);
    expect(result.currentStoredCount).toBe(0);
    expect(result.expectedCount).toBe(20);
  });

  it("should allow upgrades when stored migration count is less than or equal to expected", async () => {
    const mockPg = {
      exec: jest.fn().mockResolvedValue(undefined),
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ migration_count: 18, version: "0.0.9" }] })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const result = await checkSchemaCompatibility(mockPg as any, 20, "0.1.0");
    expect(result.allowed).toBe(true);
    expect(result.currentStoredCount).toBe(18);
  });

  it("should throw DowngradeDetectedError when stored migration count is greater than expected", async () => {
    const mockPg = {
      exec: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValueOnce({
        rows: [{ migration_count: 25, version: "0.2.0" }],
      }),
    };

    await expect(
      checkSchemaCompatibility(mockPg as any, 20, "0.1.0")
    ).rejects.toThrow(DowngradeDetectedError);
  });
});
