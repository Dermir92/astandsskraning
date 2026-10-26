import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, devIndicators: false,
  ...(process.env.C1_LOCAL_PROOF === "1" && process.env.NODE_ENV !== "production" ? { distDir: ".next-c1" } : {}),
};
export default nextConfig;
