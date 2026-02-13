/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // Redirect old Express-style routes
  async redirects() {
    return [
      {
        source: "/catering",
        destination: "/menu?tab=catering",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
