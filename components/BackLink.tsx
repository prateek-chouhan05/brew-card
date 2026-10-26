"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { previousPath } from "./AppShell";

/** "← Recipes": goes back in history when you came from the list, so your scroll position and filters return. */
export function BackLink() {
  const router = useRouter();
  return (
    <Link href="/" className="back" id="backBtn"
      onClick={(e) => { if (previousPath() === "/") { e.preventDefault(); router.back(); } }}>
      ← Recipes
    </Link>
  );
}
