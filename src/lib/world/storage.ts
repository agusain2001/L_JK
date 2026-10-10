import "server-only";
import { mediaStorage } from "@/lib/media-storage";
import { demoChime } from "./demo-chime";
const storage = mediaStorage("world-media", "for-you/");
export const privateStorage = {
  ...storage,
  async read(key: string) {
    if (key === "demo-chime.wav") return demoChime();
    return storage.read(key);
  },
  async remove(key: string) {
    if (key === "demo-chime.wav") return;
    return storage.remove(key);
  },
};
