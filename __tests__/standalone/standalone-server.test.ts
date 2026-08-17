import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import http from "node:http";

describe("Next.js Standalone Bundle Execution", () => {
  let serverProcess: ChildProcess | null = null;
  let testDataDir: string;
  const testPort = 3139;

  beforeAll(() => {
    testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "fiscalio-standalone-test-"));
  });

  afterAll(async () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it("should spawn standalone server.js and serve HTTP responses", async () => {
    const standaloneServerPath = path.join(
      process.cwd(),
      ".next",
      "standalone",
      "server.js"
    );

    expect(fs.existsSync(standaloneServerPath)).toBe(true);

    // Verify standalone schema.json exists
    const schemaJsonPath = path.join(
      process.cwd(),
      ".next",
      "standalone",
      "schema.json"
    );
    expect(fs.existsSync(schemaJsonPath)).toBe(true);
    const schema = JSON.parse(fs.readFileSync(schemaJsonPath, "utf-8"));
    expect(schema.expectedMigrationCount).toBeGreaterThan(0);

    // Spawn standalone server on test port
    serverProcess = spawn(process.execPath, [standaloneServerPath], {
      env: {
        ...process.env,
        PORT: String(testPort),
        HOSTNAME: "127.0.0.1",
        FISCALIO_DATA_DIR: testDataDir,
        NODE_ENV: "production",
      },
      stdio: "pipe",
    });

    // Wait for server to start responding
    const isReady = await new Promise<boolean>((resolve) => {
      let attempts = 0;
      const maxAttempts = 30;

      const checkHealth = () => {
        attempts++;
        const req = http.get(
          `http://127.0.0.1:${testPort}/`,
          (res) => {
            if (res.statusCode && res.statusCode < 500) {
              resolve(true);
            } else {
              if (attempts < maxAttempts) {
                setTimeout(checkHealth, 500);
              } else {
                resolve(false);
              }
            }
          }
        );

        req.on("error", () => {
          if (attempts < maxAttempts) {
            setTimeout(checkHealth, 500);
          } else {
            resolve(false);
          }
        });
      };

      setTimeout(checkHealth, 500);
    });

    expect(isReady).toBe(true);
  }, 30000);
});
