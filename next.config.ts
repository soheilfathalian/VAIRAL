import type { NextConfig } from "next";

const config: NextConfig = {
  typedRoutes: true,
  // Standalone output bundles only the runtime files Next.js needs into
  // .next/standalone/, dropping the image from ~600MB to ~150MB on Cloud Run.
  output: "standalone",
};

export default config;
