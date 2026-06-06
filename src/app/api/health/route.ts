import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  return NextResponse.json({
    hasKey: !!key,
    keyLength: key ? key.length : 0,
    keyPrefix: key ? key.substring(0, 8) : null,
    model: model || "not set",
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  });
}
