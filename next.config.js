/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fixes npm packages that depend on `fs` module
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
        timers: require.resolve('timers-browserify'),
        'timers/promises': false,
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
        assert: require.resolve('assert/'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
        'node:crypto': require.resolve('crypto-browserify'),
        'node:net': false,
        'node:tls': false,
        'node:timers/promises': false,
        'node:url': require.resolve('url'),
      };
    }
    return config;
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/Polkadot-Dashboard',
  assetPrefix: '/Polkadot-Dashboard/',
}

module.exports = nextConfig 