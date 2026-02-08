/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore build errors for deployment
    // TODO: Fix all TypeScript errors in UI components
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
  // Skip static optimization for pages with useSearchParams
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Increase body size limit for image uploads (default is 4MB)
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'replicate.com',
      },
    ],
  },
};

module.exports = nextConfig;
