import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth, dashboardPath } from "@/lib/auth";
import { Notice, meta } from "@/components/site";

export const Route = createFileRoute("/login")({
  head: () => meta("Log in", "Log in to MediCare as a patient, doctor or administrator."),
  component: Login,
});

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="bg-hero min-h-[80vh]">
      <div className="container-x flex justify-center py-16">
        <div className="card w-full max-w-lg p-8">
          <h1 className="font-display text-3xl font-semibold text-primary-deep">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setErr(""); setLoading(true);
    try {
      const u = await login(String(f.get("email")), String(f.get("password")));
      navigate({ to: dashboardPath(u.role) });
    } catch (er) { setErr((er as Error).message); } finally { setLoading(false); }
  };
  return (
    <AuthShell title="Welcome back" subtitle="Patients, doctors and admins sign in here — you'll be taken to your dashboard.">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input name="email" type="email" required autoComplete="email" className="field" /></div>
        <div><label className="label">Password</label><input name="password" type="password" required autoComplete="current-password" className="field" /></div>
        {err && <Notice kind="error">{err}</Notice>}
        <button disabled={loading} className="btn btn-primary w-full"><LogIn size={16} />{loading ? "Signing in…" : "Log in"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">New patient? <Link to="/register" className="font-semibold text-primary">Create an account</Link></p>
    </AuthShell>
  );
}
