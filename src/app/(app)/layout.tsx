import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { AppNavigation } from "@/components/app-navigation";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <a
        className="fixed left-4 top-3 z-50 -translate-y-20 bg-ink px-4 py-3 font-semibold text-paper-light transition focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="border-b border-rule bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-5 sm:gap-10">
            <Logo />
            <Suspense>
              <AppNavigation />
            </Suspense>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-ink-soft md:inline">
              {user.email}
            </span>
            <span className="hidden h-4 w-px bg-rule md:inline" />
            <LogoutButton />
          </div>
        </div>
      </header>
      <div
        className="mx-auto max-w-[92rem] px-5 py-8 sm:px-8 sm:py-12"
        id="main-content"
      >
        {children}
      </div>
    </div>
  );
}
