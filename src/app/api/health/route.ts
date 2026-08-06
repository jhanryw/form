import { NextResponse } from "next/server";

/**
 * Health check para orquestradores (EasyPanel, Docker HEALTHCHECK, etc.).
 * Só confirma que o processo Next.js está de pé — não depende de nenhum
 * serviço externo (n8n, Meta, Cal.com), para não marcar o container como
 * não saudável por uma falha de terceiros.
 */
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
