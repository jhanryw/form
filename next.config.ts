import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone com só os arquivos necessários em runtime —
  // a imagem Docker não precisa copiar node_modules inteiro.
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
