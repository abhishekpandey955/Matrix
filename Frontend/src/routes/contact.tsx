import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { PageHero, Notice, meta } from "@/components/site";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/contact")({
  head: () => meta("Contact us", "Get in touch with the MediCare support team."),
  component: Contact,
});

function Contact() {
  const [state, setState] = useState<{ loading?: boolean; ok?: boolean; err?: string }>({});
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState({ loading: true });
    try {
      await api("/contact", { method: "POST", body: Object.fromEntries(f) });
      setState({ ok: true });
      (e.target as HTMLFormElement).reset();
    } catch (er) { setState({ err: (er as Error).message }); }
  };
  return (
    <>
      <PageHero eyebrow="Contact" title="We're here to help." subtitle="Questions about appointments or your account? Send us a message." />
      <section className="container-x grid gap-8 py-16 md:grid-cols-3">
        <div className="space-y-4">
          {[[Phone, "Phone", "+91 00000 00000"], [Mail, "Email", "support@medicare.example"], [MapPin, "Address", "Your hospital address"]].map(([I, t, v]: any) => (
            <div key={t} className="card flex items-center gap-4 p-5"><I className="text-primary" /><div><p className="text-xs text-muted-foreground">{t}</p><p className="font-semibold">{v}</p></div></div>
          ))}
        </div>
        <form onSubmit={submit} className="card space-y-4 p-7 md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Name</label><input name="name" required className="field" /></div>
            <div><label className="label">Email</label><input name="email" type="email" required className="field" /></div>
          </div>
          <div><label className="label">Subject</label><input name="subject" required className="field" /></div>
          <div><label className="label">Message</label><textarea name="message" rows={5} required className="field" /></div>
          {state.ok && <Notice kind="success">Message sent. We'll get back to you soon.</Notice>}
          {state.err && <Notice kind="error">{state.err}</Notice>}
          <button disabled={state.loading} className="btn btn-primary"><Send size={16} />{state.loading ? "Sending…" : "Send message"}</button>
        </form>
      </section>
    </>
  );
}
