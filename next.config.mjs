/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  basePath: isProd ? '/data-geo' : '',
  assetPrefix: isProd ? '/data-geo/' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
