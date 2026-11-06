import type { NextConfig } from "next";

// The dashboard is a static frontend; APIs are served independently by Rails.
const nextConfig: NextConfig = { output: "export" };
export default nextConfig;
