import { NextResponse } from "next/server";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { markNotificationsRead } from "@/lib/inbox";

export const dynamic = "force-dynamic";

/** „Marchează tot ca citit” din meniul de notificări: întoarce pe pagina de unde a venit. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user) await markNotificationsRead(user.company.id);
  const back = new URL(req.headers.get("referer") ?? "/", req.url);
  const next = back.origin === new URL(req.url).origin ? safeNext(back.pathname + back.search, "/") : "/";
  return NextResponse.redirect(new URL(next, req.url), 303);
}
