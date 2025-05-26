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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=(), clipboard-read=(), clipboard-write=(), gamepad=(), speaker-selection=(), conversion-measurement=(), focus-without-user-activation=(), hid=(), idle-detection=(), interest-cohort=(), serial=(), sync-script=(), trust-token-redemption=(), window-placement=(), vertical-scroll=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'none'",
              "script-src 'self' 'nonce-{NONCE}' 'strict-dynamic'",
              "style-src 'self' 'nonce-{NONCE}'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.polkadot.io https://api.coingecko.com wss://rpc.polkadot.io",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'none'",
              "object-src 'none'",
              "manifest-src 'self'",
              "media-src 'none'",
              "worker-src 'self' blob:",
              "sandbox allow-forms allow-scripts allow-same-origin allow-popups",
              "upgrade-insecure-requests",
              "block-all-mixed-content"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 