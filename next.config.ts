import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite importar imagens e outros assets
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
