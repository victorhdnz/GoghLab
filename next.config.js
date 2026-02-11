/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: 100 * 1024 * 1024, // 100MB para upload de vídeo
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'images.unsplash.com', 'res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 0,
      pagesBufferLength: 0,
    },
  }),
}

module.exports = nextConfig

