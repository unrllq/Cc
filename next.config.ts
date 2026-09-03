import type { NextConfig } from "next";

// GitHub Pages serves this repo as a project site at /Cc/, so the static
// export build needs a matching basePath/assetPrefix. Local dev and a
// normal server deploy (e.g. Vercel) stay untouched.
const isGithubPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export",
        basePath: "/Cc",
        assetPrefix: "/Cc/",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
