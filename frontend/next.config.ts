import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    // PDF.js worker 설정
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]'
      }
    });

    return config;
  },
  // PDF.js 라이브러리를 위한 설정
  transpilePackages: ['pdfjs-dist'],
};

export default nextConfig;
