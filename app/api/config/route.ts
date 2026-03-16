// app/api/config/route.ts (or pages/api/config.ts)
import { NextResponse } from "next/server";

export async function GET() {
  console.log("SERVER_BASEURL Was Fetched");
  return NextResponse.json(
    {
      baseUrl: process.env.SERVER_BASEURL || "http://127.0.0.1/api/v1",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
