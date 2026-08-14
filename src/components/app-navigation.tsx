"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/documents", label: "Documents" },
  { href: "/reports", label: "Reports" },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-center gap-4 text-xs font-semibold sm:gap-6 sm:text-sm"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            className={`relative inline-flex min-h-11 items-center transition hover:text-vermilion ${
              active
                ? "text-vermilion after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:bg-vermilion"
                : ""
            }`}
            href={link.href}
            aria-current={active ? "page" : undefined}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
