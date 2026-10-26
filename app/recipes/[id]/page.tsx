import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL, entryById } from "@/lib/catalog";
import { BrewConsole } from "@/components/BrewConsole";
import { BackLink } from "@/components/BackLink";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = entryById(id);
  if (!e) return {};
  const description = e.kind === "drink" ? e.desc : e.kind === "house" ? e.notes : `${e.name} by ${e.author} — ${e.why}`;
  return { title: e.name, description };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!entryById(id)) notFound();
  return (
    <section className="view" id="view-brew" aria-labelledby="brewH">
      <h1 className="sr-only" id="brewH" tabIndex={-1}>Brew</h1>
      <div className="brew-top">
        <BackLink />
      </div>
      <BrewConsole id={id} />
    </section>
  );
}
