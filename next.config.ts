import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product images in Cloudflare R2 (public r2.dev bucket or a custom CDN domain).
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.havensnus.com" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/products/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

void initOpenNextCloudflareForDev();
