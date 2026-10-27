import type { NextConfig } from "next";

// Cabeceras de seguridad aplicadas a todas las respuestas.
// No se define una CSP completa: solo frame-ancestors para impedir
// que la aplicación se cargue dentro de un iframe (clickjacking).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde 127.0.0.1 o la IP de la red local.
  allowedDevOrigins: ["127.0.0.1", "192.168.0.173", "192.168.3.182", "192.168.2.2", "192.168.2.61"],

  // No anunciar "X-Powered-By: Next.js".
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
