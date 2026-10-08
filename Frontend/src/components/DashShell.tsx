import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

type Item = { to: string; label: string };
const links: Record<string, Item[]> = {
  PATIENT: [
    { to: "/patient", label: "Overview" }, { to: "/book", label: "Book appointment" },
    { to: "/appointments", label: "My appointments" }, { to: "/records", label: "Medical records" },
    { to: "/prescriptions", label: "Prescriptions" },
  ],
  DOCTOR: [{ to: "/doctor", label: "Doctor dashboard" }],
  ADMIN: [{ to: "/admin", label: "Admin dashboard" }],
};

export function DashShell({ title, children }: { title: string; children: ReactNode }) {
  const { user } = useAuth();
  const items = links[user?.role ?? "PATIENT"] ?? [];
  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit rounded-2xl bg-sidebar p-4 text-sidebar-foreground">
        <p className="px-3 text-xs uppercase tracking-widest opacity-60">{user?.role}</p>
        <p className="px-3 pb-3 font-semibold">{user?.name}</p>
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
          {items.map((i) => (
            <Link key={i.to} to={i.to as any} className="rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent hover:opacity-100"
              activeProps={{ className: "bg-sidebar-accent opacity-100" }}>{i.label}</Link>
          ))}
        </nav>
      </aside>
      <div><h1 className="mb-6 font-display text-3xl font-semibold text-primary-deep">{title}</h1>{children}</div>
    </div>
  );
}
