/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@celhm/ui', '@celhm/types', '@react-pdf/renderer'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  eslint: {
    // Disable ESLint during builds in production to avoid config issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on TypeScript errors (we'll catch them in CI)
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    // Exclude Storybook files from production build
    config.module.rules.push({
      test: /\.stories\.(tsx|ts|jsx|js)$/,
      use: {
        loader: require.resolve('./webpack-ignore-loader.js'),
      },
    });
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
