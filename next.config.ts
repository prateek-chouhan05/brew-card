import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A fully static site: `npm run build` writes plain HTML/CSS/JS to out/, which any host can serve.
  output: "export",
  images: { unoptimized: true },
  // /recipes/affogato/index.html — works on any static host, including GitHub Pages.
  trailingSlash: true,
};

export default nextConfig;
