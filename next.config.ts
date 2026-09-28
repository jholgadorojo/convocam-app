import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde 127.0.0.1 o la IP de la red local.
  allowedDevOrigins: ["127.0.0.1", "192.168.3.182"],
};

export default nextConfig;
