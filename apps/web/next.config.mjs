import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to transpile workspace packages
  transpilePackages: ["@myproject/shared", "@myproject/chess-logic"],
};

initOpenNextCloudflareForDev();

export default nextConfig;
