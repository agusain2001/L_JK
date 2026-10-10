"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { WorldData } from "@/lib/world/repository";
type BoothDraft = {
  images: string[];
  caption: string;
  frame: "cream" | "pink" | "strip";
  sticker: string;
  date: boolean;
  x: number;
  y: number;
  zoom: number;
};
const initialBooth: BoothDraft = {
  images: [],
  caption: "",
  frame: "cream",
  sticker: "heart",
  date: false,
  x: 50,
  y: 50,
  zoom: 1,
};
type WorldState = {
  data: WorldData;
  ready: boolean;
  refresh: () => Promise<void>;
  booth: BoothDraft;
  setBooth: React.Dispatch<React.SetStateAction<BoothDraft>>;
};
const Context = createContext<WorldState | null>(null);
export function WorldProvider({
  initial,
  children,
}: {
  initial: WorldData;
  children: ReactNode;
}) {
  const [data, setData] = useState(initial),
    [booth, setBooth] = useState(initialBooth);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timer);
  }, []);
  async function refresh() {
    const response = await fetch("/api/world", { cache: "no-store" });
    if (!response.ok)
      throw new Error("The little world could not be refreshed.");
    setData(await response.json());
  }
  return (
    <Context.Provider value={{ data, ready, refresh, booth, setBooth }}>
      {children}
    </Context.Provider>
  );
}
export function useWorld() {
  const context = useContext(Context);
  if (!context) throw new Error("World provider missing.");
  return context;
}
export async function worldRequest(
  url: string,
  method = "POST",
  data?: unknown,
) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const result = await response.json();
  if (!response.ok) {
    let message = result.error || "This little request could not be completed.";
    try {
      const issues = JSON.parse(message);
      if (Array.isArray(issues))
        message = issues.map((issue) => issue.message).join(" ");
    } catch {}
    throw new Error(message);
  }
  return result;
}
