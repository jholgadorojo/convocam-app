import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde 127.0.0.1 o la IP de la red local.
  allowedDevOrigins: ["127.0.0.1", "192.168.0.173", "192.168.3.182", "192.168.2.2", "192.168.2.61"],
};

export default nextConfig;
