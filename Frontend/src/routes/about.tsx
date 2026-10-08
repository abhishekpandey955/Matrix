import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Eye, HeartHandshake, ShieldCheck } from "lucide-react";
import { PageHero, meta } from "@/components/site";

export const Route = createFileRoute("/about")({
  head: () => meta("About us", "Learn about MediCare's mission to make quality healthcare simple and accessible."),
  component: About,
});

function About() {
  const values = [
    [Target, "Our mission", "Make expert healthcare accessible to everyone, wherever they are."],
    [Eye, "Our vision", "A connected health system where patients and doctors work as one team."],
    [HeartHandshake, "Patient first", "Every feature is designed around clarity, dignity and comfort."],
    [ShieldCheck, "Privacy by design", "Medical data stays protected on secure servers — never in your browser."],
  ] as const;
  return (
    <>
      <PageHero eyebrow="About MediCare" title="Healthcare that feels human, powered by thoughtful technology." subtitle="MediCare connects patients, doctors and administrators on one simple platform — from first booking to final prescription." />
      <section className="container-x grid gap-5 py-16 sm:grid-cols-2">
        {values.map(([I, t, d]) => (
          <div key={t} className="card p-7"><I className="text-primary" /><h3 className="mt-4 text-lg font-semibold text-primary-deep">{t}</h3><p className="mt-1 text-muted-foreground">{d}</p></div>
        ))}
      </section>
      <section className="container-x">
        <div className="rounded-3xl bg-gradient-primary p-10 text-center text-primary-foreground">
          <h2 className="font-display text-3xl font-semibold">Ready to take charge of your health?</h2>
          <Link to="/register" className="btn btn-outline mt-6">Create your free account</Link>
        </div>
      </section>
    </>
  );
}
