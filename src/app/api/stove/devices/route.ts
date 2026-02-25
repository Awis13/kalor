import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Duepi — одно устройство из env
export async function GET() {
  return NextResponse.json({
    devices: [
      {
        name: "Stove",
        host: process.env.DUEPI_HOST || "duepiwebserver2.com",
        port: Number(process.env.DUEPI_PORT) || 3000,
        deviceCode: process.env.DUEPI_DEVICE_CODE ? "***" : "not set",
        protocol: "duepi-evo",
        connection: process.env.DUEPI_HOST?.includes("duepiwebserver") ? "cloud" : "local",
      },
    ],
  });
}
