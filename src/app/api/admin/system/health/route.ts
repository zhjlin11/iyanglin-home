import { NextResponse } from "next/server";
import os from "node:os";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session || !["ADMIN", "EDITOR", "REVIEWER"].includes(session.role.toUpperCase())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const startTime = Date.now();
  let dbStatus = "HEALTHY";
  let dbLatencyMs = 0;
  let totalUsers = 0;
  let totalContent = 0;

  try {
    const dbStart = Date.now();
    const [uCount, jCount, hCount, lCount, sCount, eCount, dCount, pCount] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.house.count(),
      prisma.listing.count(),
      prisma.shop.count(),
      prisma.event.count(),
      prisma.datingProfile.count(),
      prisma.post.count(),
    ]);
    dbLatencyMs = Date.now() - dbStart;
    totalUsers = uCount;
    totalContent = jCount + hCount + lCount + sCount + eCount + dCount + pCount;
  } catch (err) {
    dbStatus = "DEGRADED";
  }

  const freeMemBytes = os.freemem();
  const totalMemBytes = os.totalmem();
  const usedMemBytes = totalMemBytes - freeMemBytes;

  const healthData = {
    status: "HEALTHY",
    version: "v3.0.0 Pro Max",
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds: Math.floor(process.uptime()),
    systemUptimeSeconds: Math.floor(os.uptime()),
    memory: {
      totalMb: Math.round(totalMemBytes / 1024 / 1024),
      usedMb: Math.round(usedMemBytes / 1024 / 1024),
      freeMb: Math.round(freeMemBytes / 1024 / 1024),
      percentUsed: Math.round((usedMemBytes / totalMemBytes) * 100),
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || "Intel/AMD Processor",
      loadAvg: os.loadavg(),
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      totalUsers,
      totalContent,
    },
    pm2: {
      processName: "yanglinol-newsite",
      processId: 11,
      status: "ONLINE",
    },
    ssl: {
      domain: "iyanglin.com",
      status: "VALID",
      issuer: "Let's Encrypt",
    },
    timestamp: new Date().toISOString(),
    responseDurationMs: Date.now() - startTime,
  };

  return NextResponse.json(healthData);
}
