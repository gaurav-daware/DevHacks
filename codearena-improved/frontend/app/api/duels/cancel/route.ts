import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// POST /api/duels/cancel  — leave the matchmaking queue
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tell the FastAPI backend to remove this user from the queue
    const response = await fetch(
      `${BACKEND_URL}/duels/queue/${encodeURIComponent(session.user.id)}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      // Non-fatal — user may have already been matched or wasn't in the queue
      return NextResponse.json({ status: "not_in_queue" });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Cancel queue error:", error);
    return NextResponse.json({ error: "Cancel failed" }, { status: 500 });
  }
}
