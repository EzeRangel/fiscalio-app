import { spawn, ChildProcess } from "node:child_process";
import net from "node:net";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { ElectronLogger } from "./logger";

export interface ServerManagerOptions {
  projectRoot: string;
  userDataDir: string;
  preferredPort?: number;
  logger?: ElectronLogger;
  startupTimeoutMs?: number;
}

export function isPortAvailable(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

export async function findAvailablePort(startPort = 3120, host = "127.0.0.1"): Promise<number> {
  if (await isPortAvailable(startPort, host)) {
    return startPort;
  }

  // Find ephemeral free port
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => resolve(startPort + 1));
      }
    });
  });
}

export class ServerManager {
  private projectRoot: string;
  private userDataDir: string;
  private preferredPort: number;
  private logger?: ElectronLogger;
  private startupTimeoutMs: number;
  private childProcess: ChildProcess | null = null;
  private port: number | null = null;
  private url: string | null = null;

  constructor(options: ServerManagerOptions) {
    this.projectRoot = options.projectRoot;
    this.userDataDir = options.userDataDir;
    this.preferredPort = options.preferredPort ?? 3120;
    this.logger = options.logger;
    this.startupTimeoutMs = options.startupTimeoutMs ?? 30000;
  }

  public getPreferredPort(): number {
    return this.preferredPort;
  }

  public getUserDataDir(): string {
    return this.userDataDir;
  }

  public getPort(): number | null {
    return this.port;
  }

  public getUrl(): string | null {
    return this.url;
  }

  public getChildProcess(): ChildProcess | null {
    return this.childProcess;
  }

  public async start(): Promise<{ port: number; url: string }> {
    const port = await findAvailablePort(this.preferredPort);
    this.port = port;
    this.url = `http://127.0.0.1:${port}`;

    this.logger?.info(`Resolved listening port: ${port}. Starting server...`);

    const serverScriptPath = path.join(
      this.projectRoot,
      ".next",
      "standalone",
      "server.js"
    );

    if (!fs.existsSync(serverScriptPath)) {
      const errorMsg = `Standalone server.js not found at ${serverScriptPath}. Please build before starting.`;
      this.logger?.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Spawn server child process
    const child = spawn(process.execPath, [serverScriptPath], {
      cwd: path.join(this.projectRoot, ".next", "standalone"),
      env: {
        ...process.env,
        PORT: String(port),
        HOSTNAME: "127.0.0.1",
        FISCALIO_DATA_DIR: this.userDataDir,
        NODE_ENV: "production",
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    });

    this.childProcess = child;

    child.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      this.logger?.info(`[server:stdout] ${msg.trim()}`);
    });

    child.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString();
      this.logger?.error(`[server:stderr] ${msg.trim()}`);
    });

    child.on("error", (err: Error) => {
      this.logger?.error("Child process error:", err);
    });

    child.on("exit", (code: number | null, signal: string | null) => {
      this.logger?.info(`Child process exited with code ${code}, signal ${signal}`);
      this.childProcess = null;
    });

    // Wait for server ready (HTTP probe within timeout)
    const isReady = await this.waitForServerReady(port, this.startupTimeoutMs);
    if (!isReady) {
      this.logger?.error(`Server failed to start within ${this.startupTimeoutMs}ms`);
      await this.stop();
      throw new Error(`Server startup timed out after ${this.startupTimeoutMs}ms`);
    }

    this.logger?.info(`Server is listening and responsive at ${this.url}`);
    return { port, url: this.url };
  }

  private waitForServerReady(port: number, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const probe = () => {
        if (!this.childProcess || this.childProcess.killed) {
          resolve(false);
          return;
        }

        const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve(true);
          } else {
            if (Date.now() - startTime < timeoutMs) {
              setTimeout(probe, 250);
            } else {
              resolve(false);
            }
          }
        });

        req.on("error", () => {
          if (Date.now() - startTime < timeoutMs) {
            setTimeout(probe, 250);
          } else {
            resolve(false);
          }
        });
      };

      probe();
    });
  }

  public async stop(): Promise<void> {
    if (!this.childProcess) {
      return;
    }

    const child = this.childProcess;
    this.childProcess = null;

    if (child.killed) {
      return;
    }

    this.logger?.info("Stopping server process with SIGTERM...");
    child.kill("SIGTERM");

    // Wait up to 3 seconds for graceful exit, then force SIGKILL
    await new Promise<void>((resolve) => {
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          try {
            this.logger?.warn("Server process did not exit in 3s, sending SIGKILL...");
            child.kill("SIGKILL");
          } catch {
            // ignore
          }
          resolve();
        }
      }, 3000);

      child.once("exit", () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }
}
