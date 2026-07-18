import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import { fileURLToPath } from "url";

const withNextIntl = createNextIntlPlugin("./i18n.ts");
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://3.122.244.31:5000/api/v1/auth/:path*",
      },
      {
        source: "/api/v1/:path*",
        destination: "http://3.122.244.31:5000/api/v1/:path*",
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
