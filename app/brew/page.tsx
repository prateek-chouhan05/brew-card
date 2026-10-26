"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBrewPrefs } from "@/components/providers";
import { timer } from "@/lib/timer";

/** /brew opens whatever you're brewing now, or the last recipe you opened. */
export default function BrewRedirect() {
  const router = useRouter();
  const { lastEntry } = useBrewPrefs();
  useEffect(() => {
    router.replace("/recipes/" + (timer.active && timer.brew ? timer.brew.id : lastEntry));
  }, [router, lastEntry]);
  return <p className="view">Opening your brew…</p>;
}
