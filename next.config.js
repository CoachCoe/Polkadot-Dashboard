/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
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
        '@polkadot/wasm-crypto': false,
        '@polkadot/wasm-crypto-wasm': false,
        '@polkadot/wasm-crypto-asmjs': false,
        '@polkadot/wasm-bridge': false,
        '@polkadot/wasm-util': false,
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
    };

    return config;
  },
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['raw.githubusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  basePath: process.env.NODE_ENV === 'production' ? '/Polkadot-Dashboard' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Polkadot-Dashboard' : '',
}

module.exports = nextConfig 