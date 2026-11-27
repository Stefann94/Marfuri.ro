import { cleanCui, lookupAnaf, validCui } from "@/lib/anaf";

export const dynamic = "force-dynamic";

/** Folosit de formularul de înregistrare: completează numele firmei după CUI. */
export async function GET(req: Request) {
  const cui = cleanCui(new URL(req.url).searchParams.get("cui") ?? "");
  if (!validCui(cui)) return Response.json({ ok: false, motiv: "CUI-ul nu pare corect. Verifică cifrele." }, { status: 400 });
  try {
    const firma = await lookupAnaf(cui);
    if (!firma) return Response.json({ ok: false, motiv: "Nu am găsit acest CUI la ANAF." }, { status: 404 });
    return Response.json({ ok: true, firma });
  } catch {
    return Response.json({ ok: false, motiv: "ANAF nu răspunde acum. Poți scrie numele firmei de mână." }, { status: 503 });
  }
}
