import { NextResponse } from "next/server";
import { getDuepiClient } from "@/lib/session";

export const dynamic = "force-dynamic";

interface CommandBody {
  command: "power_on" | "power_off" | "set_temp" | "set_power" | "reset_error";
  value?: number;
}

export async function POST(request: Request) {
  try {
    const body: CommandBody = await request.json();
    const client = getDuepiClient();

    switch (body.command) {
      case "power_on":
        await client.powerOn();
        break;
      case "power_off":
        await client.powerOff();
        break;
      case "set_temp": {
        if (body.value === undefined || typeof body.value !== "number") {
          return NextResponse.json({ error: "value required" }, { status: 400 });
        }
        const temp = Math.round(Math.max(10, Math.min(35, body.value)));
        await client.setTargetTemp(temp);
        break;
      }
      case "set_power": {
        if (body.value === undefined || typeof body.value !== "number") {
          return NextResponse.json({ error: "value required" }, { status: 400 });
        }
        const power = Math.round(Math.max(0, Math.min(6, body.value)));
        await client.setPowerLevel(power);
        break;
      }
      case "reset_error":
        await client.resetError();
        break;
      default:
        return NextResponse.json({ error: "Unknown command" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Command error:", error);
    return NextResponse.json(
      { error: "Command failed", detail: String(error) },
      { status: 500 }
    );
  }
}
