const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()"
  },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
  }
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com"
      }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default nextConfig;
