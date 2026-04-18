"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/app/logout-button";

const items = [
  { href: "/dashboard", label: "Dashboard", match: (p: string) => p === "/dashboard" },
  {
    href: "/proposals",
    label: "Proposals",
    match: (p: string) => p === "/proposals" || p.startsWith("/proposals/"),
  },
  {
    href: "/create-proposal",
    label: "Create proposal",
    match: (p: string) => p === "/create-proposal",
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface-muted/80">
      <div className="border-b border-line px-4 py-4">
        <Link
          href="/dashboard"
          className="block font-semibold tracking-tight text-ink transition hover:text-accent"
        >
          Sales Proposal
        </Link>
        <p className="mt-0.5 text-xs text-ink-soft">Generator</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-surface text-ink shadow-sm ring-1 ring-line"
                  : "text-ink-soft hover:bg-surface/80 hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="mt-auto border-t border-line pt-2">
          <LogoutButton />
        </div>
      </nav>
    </aside>
  );
}
