import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: { browser: "./src/modules/viewer/browser-empty.ts" },
      path: { browser: "./src/modules/viewer/browser-empty.ts" },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
      config.module.rules.push({ test: /\.wasm$/, type: "asset/resource" });
    }

    return config;
  },
};

export default nextConfig;
