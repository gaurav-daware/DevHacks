import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");

    const where: any = { isActive: true };
    if (difficulty && difficulty !== "All") where.difficulty = difficulty;
    if (tag && tag !== "All") where.tags = { has: tag };
    if (search) where.title = { contains: search, mode: "insensitive" };

    const problems = await prisma.problem.findMany({
      where,
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        acceptance: true,
        totalSubmissions: true,
        acceptedSubmissions: true,
        order: true,
      },
    });

    // Attach user solved status if authenticated
    const session = await getServerSession(authOptions);
    let solvedIds: string[] = [];
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { solvedProblems: true },
      });
      solvedIds = user?.solvedProblems || [];
    }

    const enriched = problems.map((p) => ({
      ...p,
      solved: solvedIds.includes(p.id),
      acceptance: p.totalSubmissions > 0
        ? ((p.acceptedSubmissions / p.totalSubmissions) * 100).toFixed(1) + "%"
        : p.acceptance.toFixed(1) + "%",
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Problems GET error:", error);
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
  }
}
