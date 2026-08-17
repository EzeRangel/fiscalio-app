/**
 * Smoke test: standalone server + clean-shutdown backup (Fase 1 of fixes-plan).
 *
 * Spawns the .next/standalone server against a fresh data dir, waits for a
 * 200 on /onboarding, sends SIGTERM, and asserts a Fiscalio-<ver>-*.tar.gz
 * shows up in the sibling `backups/` dir. The shutdown backup only works if
 * NEXT_MANUAL_SIG_HANDLE=1 (Next's own signal handlers would exit first).
 *
 * Exit code is 0 on success, 1 on any failed check.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const ROOT = process.cwd();
const SERVER_SCRIPT = path.join(ROOT, ".next", "standalone", "server.js");

function fail(step: string, detail?: string): never {
  console.error(`\n[smoke] FAIL: ${step}${detail ? ` — ${detail}` : ""}`);
  process.exit(1);
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object" && address.port) {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("No free port found")));
      }
    });
  });
}

async function waitForHttp(port: number, pathname: string, timeoutMs: number): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${pathname}`, {
        redirect: "manual",
      });
      if (res.status === 200) {
        return res.status;
      }
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return -1;
}

async function waitForExit(child: import("node:child_process").ChildProcess, timeoutMs: number): Promise<void> {
  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs).unref()),
  ]);
}

async function main(): Promise<void> {
  if (!fs.existsSync(SERVER_SCRIPT)) {
    fail("standalone no encontrado", "corre antes `pnpm build:standalone`");
  }

  const port = await findFreePort();
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "fiscalio-smoke-"));
  const dataDir = path.join(tmpBase, "data");

  console.log(`[smoke] standalone port   : ${port}`);
  console.log(`[smoke] data dir          : ${dataDir}`);

  const child = spawn(process.execPath, [SERVER_SCRIPT], {
    cwd: path.dirname(SERVER_SCRIPT),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      FISCALIO_DATA_DIR: dataDir,
      NODE_ENV: "production",
      NEXT_MANUAL_SIG_HANDLE: "1",
    },
    stdio: ["ignore", "inherit", "inherit"],
  });

  child.on("exit", (code, signal) => {
    console.log(`[smoke] child exited code=${code} signal=${signal}`);
  });

  const code = await waitForHttp(port, "/onboarding", 60_000);
  if (code !== 200) {
    child.kill("SIGKILL");
    fs.rmSync(tmpBase, { recursive: true, force: true });
    fail("onboarding no respondió 200", `último status=${code}`);
  }
  console.log("[smoke] /onboarding → 200 OK");

  // Wait for initDB() to finish registering the shutdown handler before SIGTERM.
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log("[smoke] enviando SIGTERM...");
  child.kill("SIGTERM");
  await waitForExit(child, 30_000);
  if (!child.killed && child.exitCode === null) {
    child.kill("SIGKILL");
    fs.rmSync(tmpBase, { recursive: true, force: true });
    fail("el proceso no salió tras SIGTERM", "¿se quedó el handler colgado?");
  }

  const backupsDir = path.join(tmpBase, "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.rmSync(tmpBase, { recursive: true, force: true });
    fail("no se creó backups/", "¿initDB llegó a registrar el shutdown handler?");
  }

  const backupFiles = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith("Fiscalio-") && f.endsWith(".tar.gz"));
  if (backupFiles.length === 0) {
    fs.rmSync(tmpBase, { recursive: true, force: true });
    fail("no se escribió ningún Fiscalio-*.tar.gz", "revisa NEXT_MANUAL_SIG_HANDLE y el keepalive");
  }

  const backupPath = path.join(backupsDir, backupFiles[0]);
  const stat = fs.statSync(backupPath);
  const head = fs.readFileSync(backupPath).subarray(0, 2);
  const isGzip = head[0] === 0x1f && head[1] === 0x8b;
  if (!isGzip || stat.size < 1024 * 1024) {
    fs.rmSync(tmpBase, { recursive: true, force: true });
    fail("backup sospechoso", `${backupFiles[0]} no es gzip o es demasiado pequeño (${stat.size} bytes)`);
  }

  console.log(`[smoke] backup escrito      : ${backupFiles[0]} (${stat.size} bytes, gzip OK)`);
  console.log(`[smoke] backups dir        : ${backupsDir}`);
  fs.rmSync(tmpBase, { recursive: true, force: true });
  console.log("\n[smoke] PASS — shutdown backup funciona.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});