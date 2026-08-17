import net from "node:http";
import { findAvailablePort, ServerManager } from "@/electron/server-manager";
import { ElectronLogger } from "@/electron/logger";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

describe("ServerManager & Port Resolution", () => {
  let tempDir: string;
  let logger: ElectronLogger;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "server-manager-test-"));
    logger = new ElectronLogger(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should find an available port on 127.0.0.1 starting with default 3120", async () => {
    const port = await findAvailablePort(3120);
    expect(port).toBeGreaterThanOrEqual(3120);
  });

  it("should initialize ServerManager with configured directories", () => {
    const manager = new ServerManager({
      projectRoot: process.cwd(),
      userDataDir: tempDir,
      preferredPort: 3120,
      logger,
      startupTimeoutMs: 5000,
    });

    expect(manager.getPreferredPort()).toBe(3120);
    expect(manager.getUserDataDir()).toBe(tempDir);
  });
});
