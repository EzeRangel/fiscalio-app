import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve("./"),
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@electric-sql/pglite/**/*",
      "./src/db/migrations/**/*",
    ],
  },
  outputFileTracingExcludes: {
    // Keep runtime-only / build artifacts out of the standalone bundle.
    // ./pglite/** would otherwise ship the dev database with the app; ./dist/**
    // is the previous electron-builder output, which would recurse into the
    // standalone and get signed file-by-file.
    "/**": ["./pglite/**", "./dist/**"],
  },
  transpilePackages: [
    "@electric-sql/pglite-react",
    "@nodecfdi/cfdi-core",
    "@nodecfdi/cfdi-to-json",
    "next-safe-action",
  ],
};

export default nextConfig;
