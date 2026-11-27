import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { CereriShell } from "@/components/cereri/pages";
import { LoginForm } from "@/components/cereri/AuthForms";

export const metadata: Metadata = { title: "Intră în cont", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <CereriShell>
      <div className="mx-auto max-w-[480px] py-10 sm:py-14">
        <div className="overflow-hidden rounded-2xl border-t-[3px] border-brand-600 bg-white shadow-[0_20px_44px_-28px_rgb(20_22_26/0.5)]">
          <div className="px-6 pt-6 sm:px-8">
            <h1 className="font-logo text-[26px] font-normal tracking-normal">Intră în cont</h1>
            <p className="mt-1.5 text-[15px] text-[#3A404A]">Cu e-mailul și parola contului firmei tale.</p>
          </div>
          <div className="px-6 pt-5 pb-7 sm:px-8">
            <LoginForm next={next} />
          </div>
        </div>
      </div>
    </CereriShell>
  );
}
