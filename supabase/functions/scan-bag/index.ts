// scan-bag: read a coffee bag's label from a photo and return what is printed on it.
// The model only reads; the app decides the taste family itself (lib/tasting.ts).
// Secrets (set in the Supabase dashboard, never in the app):
//   ANTHROPIC_API_KEY  required
//   SCAN_MODEL         optional, defaults below
//   SCAN_ENABLED       "0" turns scanning off
//   SCAN_PER_DAY       per caller per day (default 10)
//   SCAN_TOTAL_PER_DAY across everyone per day (default 300)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

const ALLOWED = [/^https:\/\/brew-card\.vercel\.app$/, /^https:\/\/brew-card-[a-z0-9-]+-prateek9144s-projects\.vercel\.app$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const MODEL = Deno.env.get("SCAN_MODEL") || "claude-haiku-4-5";
const MAX_BYTES = 3_000_000; // base64 of a ~1600 px JPEG is well under this

const LABEL_TOOL = {
  name: "record_label",
  description: "Record what is printed on the coffee bag label. Copy text as printed; use null for anything not shown.",
  input_schema: {
    type: "object",
    properties: {
      isCoffeeBag: { type: "boolean", description: "true only if the photo shows a coffee bag or coffee label" },
      name: { type: ["string", "null"], description: "the coffee's name, e.g. estate or blend name" },
      roaster: { type: ["string", "null"] },
      notes: { type: "array", items: { type: "string" }, description: "tasting notes exactly as printed, one per item, in printed order" },
      roast: { type: ["string", "null"], description: "roast level as printed, e.g. Medium, Light, Medium-dark" },
      roastedOn: { type: ["string", "null"], description: "the roast date exactly as printed, e.g. 05-10-2026; do not reformat" },
      restDays: { type: ["integer", "null"], description: "rest or degassing days if printed" },
      origin: { type: ["string", "null"], description: "region or location" },
      process: { type: ["string", "null"] },
      varietal: { type: ["string", "null"] },
      altitude: { type: ["string", "null"] },
      bitterness: { type: ["string", "null"], description: "if the label rates it: low, medium or high" },
      acidity: { type: ["string", "null"], description: "if the label rates it: low, medium or high" },
    },
    required: ["isCoffeeBag", "notes"],
  },
};

const cors = (origin: string | null) => ({
  "access-control-allow-origin": origin ?? "",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, apikey, x-client-info",
  "vary": "origin",
});
const reply = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(origin) } });

async function sha(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s + (Deno.env.get("SUPABASE_URL") ?? "")));
  return Array.from(new Uint8Array(d)).slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function withinLimits(req: Request) {
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return true;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const res = await fetch(`${url}/rest/v1/rpc/bump_scan`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ p_who: await sha(ip), p_per: Number(Deno.env.get("SCAN_PER_DAY") ?? 10), p_total: Number(Deno.env.get("SCAN_TOTAL_PER_DAY") ?? 300) }),
  });
  if (!res.ok) return true; // never block a scan because the counter failed
  return (await res.json()) === true;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const allowed = !!origin && ALLOWED.some((r) => r.test(origin));
  if (req.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: allowed ? cors(origin) : {} });
  if (!allowed) return reply({ ok: false, error: "forbidden" }, 403, null);
  if (req.method !== "POST") return reply({ ok: false, error: "bad_request" }, 405, origin);
  if (Deno.env.get("SCAN_ENABLED") === "0") return reply({ ok: false, error: "disabled" }, 503, origin);
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return reply({ ok: false, error: "disabled" }, 503, origin);

  let body: { image?: string; mediaType?: string };
  try { body = await req.json(); } catch { return reply({ ok: false, error: "bad_request" }, 400, origin); }
  const image = body.image ?? "";
  const mediaType = ["image/jpeg", "image/png", "image/webp"].includes(body.mediaType ?? "") ? body.mediaType! : "image/jpeg";
  if (!image || image.length > MAX_BYTES || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 200))) return reply({ ok: false, error: "bad_request" }, 400, origin);

  if (!(await withinLimits(req))) return reply({ ok: false, error: "limit" }, 429, origin);

  const ai = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      tools: [LABEL_TOOL],
      tool_choice: { type: "tool", name: "record_label" },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          { type: "text", text: "This is a photo of a coffee bag. The label may be sideways, curved or glossy. Read it and record only what is printed: the coffee's name, tasting notes, roast level, roast date as printed, and any origin, process, varietal, altitude and bitterness or acidity ratings. Do not guess or add anything that is not on the label." },
        ],
      }],
    }),
  });
  if (!ai.ok) return reply({ ok: false, error: "unavailable" }, 502, origin);
  const out = await ai.json();
  const label = out?.content?.find((c: { type: string }) => c.type === "tool_use")?.input;
  if (!label) return reply({ ok: false, error: "unreadable" }, 200, origin);
  if (!label.isCoffeeBag) return reply({ ok: false, error: "not_coffee" }, 200, origin);
  return reply({ ok: true, label }, 200, origin);
});
