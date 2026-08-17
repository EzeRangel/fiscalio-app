import { listBackupsAction, createManualBackupAction } from "@/actions/backups";
import { getDB, getActiveBackupEngine } from "@/db";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

jest.mock("@/db", () => ({
  getDB: jest.fn(),
  getActiveBackupEngine: jest.fn(),
}));

describe("Backup Server Actions", () => {
  let tempUserDataDir: string;
  const originalEnv = process.env.FISCALIO_DATA_DIR;

  beforeEach(() => {
    tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "backups-action-test-"));
    const dataDir = path.join(tempUserDataDir, "data");
    fs.mkdirSync(dataDir, { recursive: true });
    process.env.FISCALIO_DATA_DIR = dataDir;
  });

  afterEach(() => {
    process.env.FISCALIO_DATA_DIR = originalEnv;
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  it("should list empty backups when none exist", async () => {
    const result = await listBackupsAction();
    expect(result.data).toEqual([]);
  });

  it("should create a manual backup using PGlite dumpDataDir", async () => {
    const mockPg = {
      exec: jest.fn().mockResolvedValue(undefined),
      dumpDataDir: jest.fn().mockResolvedValue({
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      }),
    };
    (getDB as jest.Mock).mockResolvedValue({ pg: mockPg });

    const result = await createManualBackupAction();
    expect(result.data?.success).toBe(true);
    expect(result.data?.filename).toMatch(/^Fiscalio-.*\.tar\.gz$/);
    expect(fs.existsSync(result.data!.backupPath)).toBe(true);
  });
});
