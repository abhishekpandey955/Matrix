import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ShieldCheck, Sparkles, Square } from "lucide-react";
import { Notice, PageHero, meta } from "@/components/site";
import { redactSecrets } from "@/lib/redact";

export const Route = createFileRoute("/admin-setup")({
  head: () => meta("Admin setup assistant", "Get AI guidance on safely creating the first MediCare admin account."),
  component: AdminSetup,
});

const EXAMPLE = `Host: Replit (Spring Boot 3, Java 17)
Database: PostgreSQL via DATABASE_URL secret
Migrations: Flyway (V1__init.sql creates users + roles tables)
Security: Spring Security, JWT, BCrypt password encoder
Roles: PATIENT, DOCTOR, ADMIN (stored in users.role)
No admin exists yet.`;

function AdminSetup() {
  const [config, setConfig] = useState("");
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const redacted = redactSecrets(config);
  const hadSecrets = redacted !== config;

  const run = async () => {
    setErr(""); setOut(""); setLoading(true);
    const ac = new AbortController(); abort.current = ac;
    try {
      const res = await fetch("/api/admin-setup-guide", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: redacted }), signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text();
        throw new Error(res.status === 402 ? "AI credits are used up for this workspace." : res.status === 429 ? "Too many requests — please wait a moment." : t || "Request failed");
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      for (;;) { const { done, value } = await reader.read(); if (done) break; setOut((o) => o + dec.decode(value, { stream: true })); }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErr((e as Error).message);
    } finally { setLoading(false); abort.current = null; }
  };

  return (
    <>
      <PageHero eyebrow="Operators" title="Admin setup assistant" subtitle="Describe your server setup and get safe, step-by-step guidance for creating the first admin account." />
      <div className="container-x grid gap-6 py-10 lg:grid-cols-2">
        <div className="card space-y-4 p-6">
          <Notice kind="info"><ShieldCheck size={14} className="mr-1 inline" />Never paste real passwords or keys. Anything that looks like a secret is removed before it is sent.</Notice>
          <label className="label">Deployment configuration</label>
          <textarea className="field min-h-64 font-mono text-xs" value={config} onChange={(e) => setConfig(e.target.value)} placeholder={EXAMPLE} />
          {hadSecrets && <Notice kind="error">Possible secrets detected — they will be replaced with [REDACTED].</Notice>}
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={() => setConfig(EXAMPLE)} disabled={loading}>Use example</button>
            {loading
              ? <button className="btn btn-danger" onClick={() => abort.current?.abort()}><Square size={14} />Stop</button>
              : <button className="btn btn-primary" onClick={run} disabled={config.trim().length < 10}><Sparkles size={16} />Get safe steps</button>}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Recommended steps</h2>
          {err && <div className="mt-3"><Notice kind="error">{err}</Notice></div>}
          {loading && !out && <p className="mt-3 text-sm text-muted-foreground">Thinking…</p>}
          {!loading && !out && !err && <p className="mt-3 text-sm text-muted-foreground">Guidance will appear here.</p>}
          {out && <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{out}</div>}
        </div>
      </div>
    </>
  );
}
