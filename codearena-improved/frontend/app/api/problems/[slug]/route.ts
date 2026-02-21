import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const problem = await prisma.problem.findUnique({
      where: { slug: params.slug },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    return NextResponse.json(problem);
  } catch (error) {
    console.error("Problem GET error:", error);
    return NextResponse.json({ error: "Failed to fetch problem" }, { status: 500 });
  }
}
