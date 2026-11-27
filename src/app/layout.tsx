import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/site";
import { SiteFooter } from "@/components/SiteChrome";
import { SiteHeader, type NavUser } from "@/components/nav/SiteHeader";
import { getCurrentUser, initials } from "@/lib/auth";

const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });
// Fontul titlurilor și al meniului: Russo One cu Ț/ț corecte (vezi src/app/fonts/MarfuriTitluri-OFL.txt)
const russo = localFont({ src: "./fonts/MarfuriTitluri.woff2", weight: "400", display: "swap", variable: "--font-russo" });
// Titlurile mari (hero)
const jakarta = Plus_Jakarta_Sans({ weight: "800", subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} – Bursă de transport marfă: curse și camioane libere`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", locale: "ro_RO", siteName: SITE.name },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  const navUser: NavUser | null = me
    ? { company: me.company.name, initials: initials(me.company.name), verified: me.company.verified, unreadMessages: 0, notifications: [] }
    : null;
  return (
    <html lang="ro" className={`${inter.variable} ${russo.variable} ${jakarta.variable}`}>
      {/* pe telefon lăsăm loc pentru bara de jos */}
      <body className="flex min-h-dvh flex-col pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        <a href="#continut" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
          Sari la conținut
        </a>
        <SiteHeader user={navUser} />
        <main id="continut" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
