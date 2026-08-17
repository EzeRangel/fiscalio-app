import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ElectronLogger } from "@/electron/logger";

describe("ElectronLogger", () => {
  let tempDir: string;
  let logger: ElectronLogger;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "logger-test-"));
    logger = new ElectronLogger(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should write info, warn, and error messages to log file", () => {
    logger.info("Application starting");
    logger.warn("Port 3120 in use, falling back");
    logger.error("Failed to connect", new Error("Connection refused"));

    const logFile = logger.getLogFilePath();
    expect(fs.existsSync(logFile)).toBe(true);

    const content = fs.readFileSync(logFile, "utf-8");
    expect(content).toContain("[INFO] Application starting");
    expect(content).toContain("[WARN] Port 3120 in use, falling back");
    expect(content).toContain("[ERROR] Failed to connect");
    expect(content).toContain("Connection refused");
  });
});
