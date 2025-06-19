import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize webpack cache strategy to handle large strings
    if (config.cache) {
      config.cache = {
        ...config.cache,
        compression: 'gzip',
        maxAge: 5000000, // 5MB cache limit
        // Optimize caching strategy for large files
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Suppress webpack cache warnings for large strings
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: 'error',
    };

    // Optimize module concatenation for better performance
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      chunkIds: 'deterministic',
      splitChunks: {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Separate large components into their own chunks
          largeComponents: {
            test: /[\\/]components[\\/]ui[\\/]form-component\.tsx$/,
            name: 'form-component',
            chunks: 'all',
            priority: 20,
          },
        },
      },
    };

    return config;
  },
};

export default nextConfig;
