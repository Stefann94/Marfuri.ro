import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Ieșire din cont (linkul „Ieși din cont” din meniu). */
export async function GET(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", req.url));
}

export const POST = GET;
