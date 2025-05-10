/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
  async redirects() {
    return [
      {
        source: '/start',
        destination: '/chat',
        permanent: true,
      },
    ]
  },
}

export default nextConfig

