/**
 * Static export for GitHub Pages. Set NEXT_PUBLIC_BASE_PATH to "/<repo>"
 * when the site is served from https://<user>.github.io/<repo>/.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
