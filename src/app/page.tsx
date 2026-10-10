import StoryExperience from "@/components/StoryExperience";
import EntryExperience from "@/components/entry/EntryExperience";
import { RomanticMusicProvider } from "@/components/RomanticMusic";
import { publicMemories } from "@/lib/memories";
import { readGameConfig } from "@/lib/games/content";
import { availableConfig } from "@/lib/games/engines";
import { worldData } from "@/lib/world/repository";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [memories, config, world] = await Promise.all([
    publicMemories(),
    readGameConfig(),
    worldData(),
  ]);
  return (
    <RomanticMusicProvider><EntryExperience><StoryExperience
      memories={memories}
      games={availableConfig(config, memories)}
      world={{
        enabled: Object.entries(world.flags).some(
          ([key, value]) => key !== "world" && value,
        ),
        daily: world.daily?.body || null,
        saveRewards: !!world.actor && world.flags.keepsakes !== false,
        userId: world.actor?.id,
      }}
    /></EntryExperience></RomanticMusicProvider>
  );
}
