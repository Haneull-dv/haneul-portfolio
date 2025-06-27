import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 외부 이미지 도메인 허용 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
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
