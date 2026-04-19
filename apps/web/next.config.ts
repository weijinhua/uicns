import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /** Omit `output: "standalone"` here if Windows build fails on symlink (EPERM); enable on Linux CI for slimmer Docker. */
  transpilePackages: ["@charts-generator/ui"],
};

export default withNextIntl(nextConfig);
