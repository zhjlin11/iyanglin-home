import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();
  let dbStatus = "HEALTHY";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "UNHEALTHY";
  }

  const durationMs = Date.now() - start;

  if (dbStatus !== "HEALTHY") {
    return NextResponse.json(
      { status: "UNHEALTHY", database: dbStatus, timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "OK",
    service: "yanglinol-newsite",
    version: "v1.0.0",
    commit: process.env.GIT_COMMIT || "e5fa066",
    buildTime: process.env.BUILD_TIME || "2026-09-18T20:35:27.000Z",
    environment: process.env.NODE_ENV || "production",
    database: "HEALTHY",
    latencyMs: durationMs,
    timestamp: new Date().toISOString(),
  });
}
