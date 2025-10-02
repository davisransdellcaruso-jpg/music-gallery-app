/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "bzllhepdcooxjekehkvc.supabase.co", // ✅ Supabase storage
      "localhost",                        // ✅ local dev
      "daviscaruso.com"                   // ✅ your custom domain
    ],
  },
};

export default nextConfig;
