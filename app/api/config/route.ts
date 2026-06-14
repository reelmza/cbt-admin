// app/api/config/route.ts (or pages/api/config.ts)
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      serverApiUrl:
        process.env.SERVER_API_URL || "http://127.0.0.1:4000/api/v1",
      clientApiUrl:
        process.env.CLIENT_API_URL || "http://127.0.0.1:4000/api/v1",
      schoolName: process.env.SCHOOL_NAME || null,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}
