import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { messages, notifications } from "@/db/schema";

const KINDS = ["load", "offer", "doc", "rating"] as const;
type Kind = (typeof KINDS)[number];

/** Pentru bara de sus: ultimele notificări ale firmei și câte mesaje necitite are. */
export async function navInbox(companyId: number) {
  const [rows, [{ unread }]] = await Promise.all([
    db
      .select({
        id: notifications.id,
        kind: notifications.kind,
        title: notifications.title,
        body: notifications.body,
        href: notifications.href,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
      })
      .from(notifications)
      .where(eq(notifications.companyId, companyId))
      .orderBy(desc(notifications.createdAt))
      .limit(6),
    db
      .select({ unread: count() })
      .from(messages)
      .where(and(eq(messages.toCompanyId, companyId), isNull(messages.readAt))),
  ]);
  return {
    unreadMessages: unread,
    notifications: rows.map((n) => ({
      id: String(n.id),
      kind: (KINDS.includes(n.kind as Kind) ? n.kind : "load") as Kind,
      title: n.title,
      text: n.body,
      href: n.href ?? "/cont",
      createdAt: n.createdAt,
      unread: !n.readAt,
    })),
  };
}

/** Marchează ca citite toate notificările firmei. */
export async function markNotificationsRead(companyId: number) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.companyId, companyId), isNull(notifications.readAt)));
}
