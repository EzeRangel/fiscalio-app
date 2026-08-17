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
  transpilePackages: [
    "@electric-sql/pglite-react",
    "@nodecfdi/cfdi-core",
    "@nodecfdi/cfdi-to-json",
    "next-safe-action",
  ],
};

export default nextConfig;
