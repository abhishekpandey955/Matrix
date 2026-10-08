import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, HeartPulse, Brain, Bone, Star, ShieldCheck } from "lucide-react";
import heroClinic from "@/assets/hero-clinic.jpg";
import patientEleanor from "@/assets/patient-eleanor.jpg";
import patientMarcus from "@/assets/patient-marcus.jpg";
import { doctorApi } from "@/lib/api";
import { DataState, meta } from "@/components/site";
import { DoctorCard } from "@/components/DoctorCard";

export const Route = createFileRoute("/")({
  head: () => meta("Your health, beautifully organised", "MediCare lets patients find specialists, book appointments and track prescriptions online."),
  component: Home,
});

const services = [
  { icon: HeartPulse, t: "Cardiovascular", d: "Advanced cardiac imaging and long-term heart health management.", featured: false },
  { icon: Brain, t: "Neurological Care", d: "Precision diagnosis and rehabilitation for brain and nerve conditions.", featured: true },
  { icon: Bone, t: "Orthopedics", d: "Restoring mobility through minimally invasive joint and sports care.", featured: false },
];

const testimonials = [
  {
    img: patientEleanor,
    quote: "The cardiology team at MediCare didn't just treat me — they gave me the confidence to live fully again. The care felt truly personal.",
    name: "Eleanor Vance",
    role: "Cardiac care patient",
  },
  {
    img: patientMarcus,
    quote: "Booking took seconds, and I've never felt so supported through a medical journey. Modern technology, but the human touch comes first.",
    name: "Marcus Thorne",
    role: "Neurology patient",
  },
];

function Stars() {
  return (
    <div className="flex gap-1 text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className="fill-current" />
      ))}
    </div>
  );
}

function Home() {
  const q = useQuery({ queryKey: ["doctors", "featured"], queryFn: () => doctorApi.list(), retry: false });
  return (
    <>
      {/* Hero */}
      <section className="container-x grid items-center gap-16 py-16 lg:grid-cols-12 lg:py-28">
        <div className="space-y-10 lg:col-span-7">
          <span className="eyebrow"><ShieldCheck size={14} />World-class clinical excellence</span>
          <h1 className="font-display text-6xl leading-[0.95] tracking-tight text-primary-deep md:text-7xl lg:text-8xl">
            Healthcare <br /><em className="text-primary">elevated.</em>
          </h1>
          <p className="max-w-xl text-xl font-light leading-relaxed text-muted-foreground">
            Discover a new standard of personalised care — find the right specialist, book in seconds and keep your records and prescriptions together, securely.
          </p>
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link to="/book" className="btn btn-primary px-10 py-5 text-base">Book appointment</Link>
            <Link to="/doctors" className="card flex items-center gap-4 px-6 py-4 transition hover:-translate-y-0.5">
              <span className="flex -space-x-3">
                <img src={patientEleanor} alt="Patient" width={816} height={816} loading="lazy" className="h-9 w-9 rounded-full border-2 border-card object-cover" />
                <img src={patientMarcus} alt="Patient" width={816} height={816} loading="lazy" className="h-9 w-9 rounded-full border-2 border-card object-cover" />
                <img src={heroClinic} alt="Patient" width={1024} height={1280} loading="lazy" className="h-9 w-9 rounded-full border-2 border-card object-cover" />
              </span>
              <span className="text-sm font-medium text-muted-foreground">Trusted by 25k+ patients</span>
            </Link>
          </div>
        </div>
        <div className="relative lg:col-span-5">
          <img src={heroClinic} alt="Doctor consulting a smiling patient in a sunlit clinic" width={1024} height={1280} className="aspect-[4/5] w-full rounded-[3rem] object-cover shadow-soft" />
          <div className="card absolute -bottom-8 -right-4 max-w-[280px] p-7 backdrop-blur-xl md:-right-10">
            <p className="font-display text-4xl text-primary">4.9★</p>
            <p className="mt-1 text-sm font-semibold text-primary-deep">Average patient rating</p>
            <p className="mt-2 text-xs text-muted-foreground">Based on thousands of verified visit reviews across all specialties.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card py-14">
        <div className="container-x grid grid-cols-2 gap-10 md:grid-cols-4">
          {[["120+", "Specialist doctors"], ["25k", "Patients served"], ["40k", "Appointments booked"], ["24/7", "Online booking"]].map(([v, l]) => (
            <div key={l} className="border-l-2 border-primary pl-6">
              <p className="font-display text-4xl font-semibold text-primary-deep">{v}</p>
              <p className="mt-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container-x py-24 lg:py-32">
        <div className="mb-16 flex items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className="eyebrow">Services</span>
            <h2 className="mt-3 font-display text-5xl text-primary-deep">Specialised expertise</h2>
            <p className="mt-4 text-lg text-muted-foreground">Multidisciplinary teams using the latest diagnostic tools to provide precise, compassionate treatment.</p>
          </div>
          <Link to="/services" className="btn btn-outline hidden md:inline-flex">All services<ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {services.map(({ icon: I, t, d, featured }) => (
            <Link
              key={t}
              to="/doctors"
              search={{ specialization: t }}
              className={
                featured
                  ? "group rounded-[2.5rem] bg-primary-deep p-10 text-sidebar-foreground shadow-soft transition-all duration-500 hover:shadow-xl lg:-translate-y-6"
                  : "card group p-10 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              }
            >
              <span className={`grid h-16 w-16 place-items-center rounded-2xl transition-transform group-hover:scale-110 ${featured ? "bg-sidebar-accent text-cyan" : "bg-accent text-primary"}`}>
                <I size={30} />
              </span>
              <h3 className={`mt-8 font-display text-2xl ${featured ? "" : "text-primary-deep"}`}>{t}</h3>
              <p className={`mt-3 leading-relaxed ${featured ? "opacity-75" : "text-muted-foreground"}`}>{d}</p>
              <span className={`mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-all group-hover:gap-4 ${featured ? "text-cyan" : "text-primary"}`}>
                Find a specialist <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/60 py-24 lg:py-32">
        <div className="container-x">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="eyebrow justify-center">Patient voices</span>
            <h2 className="mt-3 font-display text-5xl text-primary-deep">Loved by our patients</h2>
            <p className="mt-4 text-lg text-muted-foreground">Real stories from people who entrusted us with their health and well-being.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {testimonials.map(({ img, quote, name, role }) => (
              <figure key={name} className="card flex flex-col gap-6 rounded-[2.5rem] p-10 sm:flex-row sm:items-start">
                <img src={img} alt={`Portrait of ${name}`} width={816} height={816} loading="lazy" className="h-24 w-24 shrink-0 rounded-3xl object-cover" />
                <div className="space-y-4">
                  <Stars />
                  <blockquote className="font-display text-xl italic leading-relaxed text-foreground">“{quote}”</blockquote>
                  <figcaption>
                    <p className="font-bold text-primary-deep">{name}</p>
                    <p className="text-sm font-medium uppercase tracking-widest text-primary">{role}</p>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors */}
      <section className="container-x py-24 lg:py-32">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <h2 className="font-display text-5xl leading-tight text-primary-deep md:text-6xl">
            Meet our clinical <br /><em className="text-primary">leaders</em>
          </h2>
          <div className="max-w-md">
            <p className="mb-6 text-muted-foreground">Specialists recruited from leading institutions, bringing world-class expertise to your local care.</p>
            <Link to="/doctors" className="btn btn-outline">View full directory<ArrowRight size={16} /></Link>
          </div>
        </div>
        <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} emptyText="No doctors listed yet." onRetry={() => q.refetch()}>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{q.data?.slice(0, 4).map((d) => <DoctorCard key={d.id} d={d} />)}</div>
        </DataState>
      </section>
    </>
  );
}
