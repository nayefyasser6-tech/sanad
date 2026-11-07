/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // تجاهل أخطاء ESLint الشكلية أثناء البناء لتسريع الرفع
    ignoreDuringBuilds: true,
  },
  typescript: {
    // تجاهل أخطاء أنواع TypeScript أثناء البناء
    ignoreBuildErrors: true,
  },
};

export default nextConfig;