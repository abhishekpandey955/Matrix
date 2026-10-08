import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartPulse, Brain, Baby, Bone, Eye, Smile, Activity, Microscope } from "lucide-react";
import { PageHero, meta } from "@/components/site";

export const Route = createFileRoute("/services")({
  head: () => meta("Services", "Explore MediCare's medical specialties, from cardiology to pediatrics."),
  component: Services,
});

const list = [
  [HeartPulse, "Cardiology", "ECGs, heart check-ups, hypertension management."],
  [Brain, "Neurology", "Migraines, epilepsy, stroke follow-up care."],
  [Baby, "Pediatrics", "Vaccinations, growth tracking, child wellness."],
  [Bone, "Orthopedics", "Fractures, joint pain, physiotherapy plans."],
  [Eye, "Ophthalmology", "Vision tests, cataract and retina care."],
  [Smile, "Dentistry", "Cleaning, fillings, orthodontic consults."],
  [Activity, "General Medicine", "Everyday illnesses and preventive check-ups."],
  [Microscope, "Diagnostics", "Lab tests and reports delivered to your records."],
] as const;

function Services() {
  return (
    <>
      <PageHero eyebrow="Services" title="Every specialty you need, one booking away." subtitle="Choose a specialty to see available doctors and book instantly." />
      <section className="container-x grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {list.map(([I, t, d]) => (
          <div key={t} className="card flex flex-col p-6">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary"><I /></span>
            <h3 className="mt-5 font-semibold text-primary-deep">{t}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{d}</p>
            <Link to="/doctors" search={{ specialization: t }} className="btn btn-outline mt-5">View doctors</Link>
          </div>
        ))}
      </section>
    </>
  );
}
