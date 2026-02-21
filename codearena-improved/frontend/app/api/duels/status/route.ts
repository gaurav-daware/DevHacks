import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// GET /api/duels/status?queue_id=xxx  — poll for matchmaking result
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queueId = searchParams.get("queue_id");

    if (!queueId) {
      return NextResponse.json({ error: "queue_id is required" }, { status: 400 });
    }

    // Proxy to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/duels/queue/status/${queueId}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Queue status error:", error);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
