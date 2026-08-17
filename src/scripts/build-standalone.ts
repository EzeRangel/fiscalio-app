import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface CopyStandaloneOptions {
  projectRoot?: string;
}

export interface BuildStandaloneResult {
  expectedMigrationCount: number;
  standaloneDir: string;
}

/**
 * Copies static assets, migrations, and writes schema.json into Next.js standalone output.
 */
export function copyStandaloneAssets(
  options: CopyStandaloneOptions = {}
): BuildStandaloneResult {
  const root = options.projectRoot || process.cwd();
  const standaloneDir = path.join(root, ".next", "standalone");
  const publicSrc = path.join(root, "public");
  const publicDest = path.join(standaloneDir, "public");
  const staticSrc = path.join(root, ".next", "static");
  const staticDest = path.join(standaloneDir, ".next", "static");
  const migrationsSrc = path.join(root, "src", "db", "migrations");
  const migrationsDest = path.join(standaloneDir, "src", "db", "migrations");

  if (!fs.existsSync(standaloneDir)) {
    throw new Error(
      `Standalone directory not found at ${standaloneDir}. Please run next build first.`
    );
  }

  // 1. Copy public directory if present
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  // 2. Copy .next/static directory
  if (fs.existsSync(staticSrc)) {
    fs.mkdirSync(path.dirname(staticDest), { recursive: true });
    fs.cpSync(staticSrc, staticDest, { recursive: true });
  }

  // 3. Copy migrations directory to ensure DB migration runtime files are available
  if (fs.existsSync(migrationsSrc)) {
    fs.mkdirSync(path.dirname(migrationsDest), { recursive: true });
    fs.cpSync(migrationsSrc, migrationsDest, { recursive: true });
  }

  // 4. Read migrations journal to determine expected migration count
  let expectedMigrationCount = 0;
  const journalPath = path.join(migrationsSrc, "meta", "_journal.json");
  if (fs.existsSync(journalPath)) {
    try {
      const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8"));
      expectedMigrationCount = Array.isArray(journal.entries)
        ? journal.entries.length
        : 0;
    } catch {
      expectedMigrationCount = 0;
    }
  }

  // 5. Read package version
  let version = "1.0.0";
  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      version = pkg.version || version;
    } catch {
      // fallback to 1.0.0
    }
  }

  // 6. Write schema.json to standalone root
  const schemaPayload = {
    expectedMigrationCount,
    version,
    generatedAt: new Date().toISOString(),
  };

  const schemaJsonPath = path.join(standaloneDir, "schema.json");
  fs.writeFileSync(schemaJsonPath, JSON.stringify(schemaPayload, null, 2), "utf-8");

  return {
    expectedMigrationCount,
    standaloneDir,
  };
}

export function buildStandalone(options: { skipNextBuild?: boolean } = {}) {
  if (!options.skipNextBuild) {
    console.log("Building Next.js standalone bundle...");
    execSync("pnpm next build", { stdio: "inherit" });
  }

  console.log("Copying standalone assets and generating schema.json...");
  const result = copyStandaloneAssets();
  console.log(
    `Standalone build ready at ${result.standaloneDir} (expected migrations: ${result.expectedMigrationCount})`
  );
  return result;
}

if (process.argv[1] && process.argv[1].includes("build-standalone")) {
  buildStandalone();
}
