import type { NextConfig } from "next";
import { developmentMode } from "./src/lib/cloud/development-mode.mjs";

const mode = developmentMode();

const nextConfig: NextConfig = {
  poweredByHeader: false, devIndicators: false,
  ...(mode === "c1-local" ? { distDir: ".next-c1" } : mode === "h1a-hosted" ? { distDir: ".next-h1a" } : {}),
};
export default nextConfig;
