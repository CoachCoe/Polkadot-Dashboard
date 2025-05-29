/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@polkadot/api', '@polkadot/extension-dapp'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        https: require.resolve('https-browserify'),
        http: require.resolve('stream-http'),
        buffer: require.resolve('buffer/'),
        assert: require.resolve('assert/'),
        os: require.resolve('os-browserify/browser'),
        process: require.resolve('process/browser'),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      );
    }

    // Handle WASM modules
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      syncWebAssembly: true,
    };

    // Add WASM support
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.wasm$/,
          type: 'webassembly/async',
        }
      ]
    };

    return config;
  },
  images: {
    domains: ['raw.githubusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  // Remove basePath and assetPrefix for local development
  ...(process.env.NODE_ENV === 'production' ? {
    basePath: '/Polkadot-Dashboard',
    assetPrefix: '/Polkadot-Dashboard',
  } : {}),
}

module.exports = nextConfig 