import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth, dashboardPath } from "@/lib/auth";
import { Notice, meta } from "@/components/site";
import { AuthShell } from "./login";

export const Route = createFileRoute("/register")({
  head: () => meta("Patient registration", "Create your MediCare patient account to book appointments online."),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const { registerPatient } = useAuth();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (f["password"] !== f["confirm"]) return setErr("Passwords do not match.");
    if ((f["password"] ?? "").length < 8) return setErr("Password must be at least 8 characters.");
    const { confirm: _c, ...data } = f;
    setErr(""); setLoading(true);
    try {
      const u = await registerPatient(data as any);
      setOk(true);
      setTimeout(() => navigate({ to: dashboardPath(u.role) }), 800);
    } catch (er) { setErr((er as Error).message); } finally { setLoading(false); }
  };
  return (
    <AuthShell title="Create your account" subtitle="Register as a patient to book and manage appointments.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Full name</label><input name="fullName" required className="field" /></div>
        <div><label className="label">Email</label><input name="email" type="email" required className="field" /></div>
        <div><label className="label">Phone</label><input name="phone" required className="field" /></div>
        <div><label className="label">Date of birth</label><input name="dateOfBirth" type="date" required className="field" /></div>
                <div><label className="label">Address</label><input name="address" required className="field" /></div>
        <div><label className="label">Password</label><input name="password" type="password" required autoComplete="new-password" className="field" /></div>
        <div><label className="label">Confirm password</label><input name="confirm" type="password" required className="field" /></div>
        <div className="sm:col-span-2 space-y-3">
          {err && <Notice kind="error">{err}</Notice>}
          {ok && <Notice kind="success">Account created! Taking you to your dashboard…</Notice>}
          <button disabled={loading} className="btn btn-primary w-full"><UserPlus size={16} />{loading ? "Creating…" : "Register"}</button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-semibold text-primary">Log in</Link></p>
    </AuthShell>
  );
}
