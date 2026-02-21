import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, errorOutput, problemDescription, language, conversation } = await req.json();

    const response = await fetch(`${BACKEND_URL}/ai/hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: session.user.id,
        code,
        error_output: errorOutput,
        problem_description: problemDescription,
        language,
        conversation: conversation || [],
      }),
    });

    if (!response.ok) {
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI hint error:", error);
    return NextResponse.json(
      { hint: "I'm having trouble connecting right now. Try checking your logic step by step — what does your code do on the first iteration?" },
      { status: 200 }
    );
  }
}
