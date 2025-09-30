/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',

  images: { unoptimized: true },
  
  // Exclude backup directory from build
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/backup_root_app/**', '**/pickleglass_web/**', '**/node_modules/**']
    }
    return config
  }
}

module.exports = nextConfig 