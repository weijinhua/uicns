import { nextConfig } from "@charts-generator/eslint-config";

export default [
  ...nextConfig,
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
];
