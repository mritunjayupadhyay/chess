/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to transpile workspace packages
  transpilePackages: ["@myproject/shared", "@myproject/chess-logic"],
};

export default nextConfig;
