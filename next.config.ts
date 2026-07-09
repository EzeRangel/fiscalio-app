import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join("./"),
  },
  serverExternalPackages: ["@electric-sql/pglite"],
  transpilePackages: [
    "@electric-sql/pglite-react",
    "@nodecfdi/cfdi-core",
    "@nodecfdi/cfdi-to-json",
    "next-safe-action"
  ],
};

export default nextConfig;
