import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { HeartPulse, Menu, X, LogOut, LayoutDashboard, Loader2, AlertTriangle, Inbox, Lock } from "lucide-react";
import { useAuth, dashboardPath } from "@/lib/auth";
import type { Role } from "@/lib/api";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/doctors", label: "Doctors" },
  { to: "/contact", label: "Contact" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold text-primary-deep">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
        <HeartPulse size={20} />
      </span>
      <span className="text-lg">Medi<span className="text-primary">Care</span></span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = async () => { await logout(); navigate({ to: "/" }); };
  return (
    <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              activeProps={{ className: "text-primary bg-secondary" }} activeOptions={{ exact: n.to === "/" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to={dashboardPath(user.role)} className="btn btn-outline"><LayoutDashboard size={16} />Dashboard</Link>
              <button onClick={doLogout} className="btn btn-ghost"><LogOut size={16} />Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Get started</Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t bg-card md:hidden">
          <div className="container-x flex flex-col gap-1 py-3" onClick={() => setOpen(false)}>
            {nav.map((n) => <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2 font-medium">{n.label}</Link>)}
            {user ? (
              <>
                <Link to={dashboardPath(user.role)} className="btn btn-outline mt-2">Dashboard</Link>
                <button onClick={doLogout} className="btn btn-ghost">Logout</button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" className="btn btn-outline">Log in</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary-deep text-sidebar-foreground">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-lg font-bold"><HeartPulse className="text-cyan" />MediCare</div>
          <p className="mt-3 max-w-sm text-sm opacity-75">Book trusted specialists, manage prescriptions and keep your medical history in one secure place.</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Explore</p>
          {nav.map((n) => <Link key={n.to} to={n.to} className="block opacity-75 hover:opacity-100">{n.label}</Link>)}
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Account</p>
          <Link to="/login" className="block opacity-75 hover:opacity-100">Log in</Link>
          <Link to="/register" className="block opacity-75 hover:opacity-100">Register</Link>
          <Link to="/book" className="block opacity-75 hover:opacity-100">Book appointment</Link>
          <Link to="/admin-setup" className="block opacity-75 hover:opacity-100">Admin setup assistant</Link>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-5 text-center text-xs opacity-60">© {new Date().getFullYear()} MediCare. All rights reserved.</div>
    </footer>
  );
}

export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="bg-hero border-b">
      <div className="container-x py-14 md:py-20">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold text-primary-deep md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function DataState({ loading, error, empty, emptyText = "Nothing here yet.", onRetry, children }: {
  loading: boolean; error: unknown; empty?: boolean; emptyText?: string; onRetry?: () => void; children: ReactNode;
}) {
  if (loading) return <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground"><Loader2 className="animate-spin" size={18} />Loading…</div>;
  if (error) return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <AlertTriangle className="text-destructive" />
      <p className="text-sm text-destructive">{(error as Error).message}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-outline">Try again</button>}
    </div>
  );
  if (empty) return <div className="flex flex-col items-center gap-2 py-14 text-muted-foreground"><Inbox />{emptyText}</div>;
  return <>{children}</>;
}

export function Notice({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const tone = kind === "error" ? "bg-destructive/10 text-destructive" : kind === "success" ? "bg-success/10 text-success" : "bg-secondary text-secondary-foreground";
  return <div className={`rounded-xl px-4 py-3 text-sm ${tone}`}>{children}</div>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <DataState loading error={null}>{null}</DataState>;
  if (!user || !roles.includes(user.role)) {
    return (
      <div className="container-x py-24">
        <div className="card mx-auto max-w-md p-8 text-center">
          <Lock className="mx-auto text-primary" />
          <h2 className="mt-3 text-xl font-semibold">{user ? "Access restricted" : "Please log in"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">This page is available to {roles.join(" / ").toLowerCase()} accounts.</p>
          <Link to="/login" className="btn btn-primary mt-6">Go to login</Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "bg-warning/15 text-warning", CONFIRMED: "bg-primary/10 text-primary", COMPLETED: "bg-success/15 text-success",
    NO_SHOW: "bg-destructive/10 text-destructive", CANCELLED: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

export function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
      <div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-2xl font-bold text-primary-deep">{value}</p></div>
    </div>
  );
}

export function DoctorAvatar({ name, url, size = 56 }: { name: string; url?: string | undefined; size?: number }) {
  const initials = name.replace(/^Dr\.?\s*/i, "").split(" ").map((s) => s[0]).slice(0, 2).join("");
  return url
    ? <img src={url} alt={name} width={size} height={size} className="rounded-2xl object-cover" style={{ width: size, height: size }} />
    : <span className="grid shrink-0 place-items-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground" style={{ width: size, height: size }}>{initials}</span>;
}

export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} | MediCare` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | MediCare` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
