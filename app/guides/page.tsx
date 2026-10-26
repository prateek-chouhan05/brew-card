import type { Metadata } from "next";
import { Guides } from "@/components/Guides";

export const metadata: Metadata = { title: "Guides" };

export default function GuidesPage() {
  return <Guides />;
}
