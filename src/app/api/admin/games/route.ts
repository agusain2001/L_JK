import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/security";
import { readGameConfig, saveGameConfig } from "@/lib/games/content";
import { gameConfigSchema } from "@/lib/games/schemas";
import { publicMemories } from "@/lib/memories";
export async function GET(req: NextRequest) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    config: await readGameConfig(),
    media: await publicMemories(),
  });
}
export async function PUT(req: NextRequest) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length")) > 200000)
    return NextResponse.json(
      { error: "Content is too large." },
      { status: 413 },
    );
  const parsed = gameConfigSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: parsed.error.issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .slice(0, 4)
          .join(" "),
      },
      { status: 400 },
    );
  const ids = new Set(
    (await publicMemories()).filter((m) => m.kind === "image").map((m) => m.id),
  );
  if (
    parsed.data.quizQuestions.some((q) => q.imageId && !ids.has(q.imageId)) ||
    parsed.data.puzzles.some((p) => !ids.has(p.approvedMediaId))
  )
    return NextResponse.json(
      {
        error:
          "Questions and puzzles can only reference currently approved photographs (or samples when no real memories are published). Remove or replace unavailable media references.",
      },
      { status: 400 },
    );
  try {
    await saveGameConfig(parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not save game content. Check persistent storage permissions.",
      },
      { status: 500 },
    );
  }
}
