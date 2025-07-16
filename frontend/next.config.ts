import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  transpilePackages: ['pdfjs-dist'],

  webpack: (config, { isServer }) => {
    // ✅ Webpack에 경로 alias 추가
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@components': path.resolve(__dirname, 'src/shared/components'),
      '@': path.resolve(__dirname, 'src'),
    };

    // PDF.js worker 관련 설정 (유지)
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    });

    return config;
  },
};

export default nextConfig;
