"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/toast-provider";

export function LogoutButton() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) {
      setPending(false);
      return;
    }
    toast.success("Signed out successfully.");
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-soft transition hover:text-vermilion disabled:opacity-50"
      type="button"
      onClick={logout}
      disabled={pending}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
