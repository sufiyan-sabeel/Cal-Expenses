/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    unoptimized: true,
  },
  ...(isExport
    ? {
        output: 'export',
        basePath: '/Cal-Expenses',
        assetPrefix: '/Cal-Expenses/',
      }
    : {}),
  trailingSlash: true,
};

module.exports = nextConfig;
