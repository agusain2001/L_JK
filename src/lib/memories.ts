import "server-only";
import { db } from "./db";
import type { Memory } from "@prisma/client";
import type { MemoryMedia } from "@/types/memory";
import { demoMemories } from "@/config/story";
import { actor, permits } from "./world/auth";
export function serializeMemory(m: Memory): MemoryMedia {
  return {
    ...m,
    audience: m.audience === "private" ? "private" : "public",
    thumbnailUrl: m.thumbnailUrl ?? undefined,
    sourceUrl: m.sourceUrl ?? undefined,
    date: m.date ?? undefined,
    location: m.location ?? undefined,
    kind: m.kind === "video" ? "video" : "image",
    tags: JSON.parse(m.tags) as string[],
  };
}
export async function publicMemories() {
  const who = await actor();
  const memories = await db.memory.findMany({
    where: { approved: true },
    orderBy: { order: "asc" },
  });
  const allowed = memories.filter(memory => permits(memory, who));
  const result=allowed.length ? allowed.map(serializeMemory) : demoMemories.map(memory=>({...memory}));
  const flag=await db.featureSettings.findUnique({where:{key:"voice"}});
  if(flag?.enabled!==false){const voices=await db.worldContent.findMany({where:{kind:"voice",enabled:true},include:{memories:true},orderBy:{displayOrder:"asc"}});for(const memory of result){const voice=voices.find(record=>permits(record,who)&&record.memories.some(link=>link.memoryId===memory.id));if(voice)memory.voiceId=voice.id;}}
  return result;
}
