import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CalendarCheck, Clock } from "lucide-react";
import { doctorApi } from "@/lib/api";
import { DataState, DoctorAvatar, meta } from "@/components/site";

export const Route = createFileRoute("/doctors/$id")({
  head: () => meta("Doctor profile", "View doctor experience and availability, then book."),
  component: Profile,
});

const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

function Profile() {
  const id = Route.useParams().id;
  const q = useQuery({ queryKey: ["doctor", id], queryFn: () => doctorApi.get(id), retry: false });
  const [from, to] = [new Date().toISOString(), new Date(Date.now() + 14 * 864e5).toISOString()];
  const av = useQuery({ queryKey: ["availability", id], queryFn: () => doctorApi.availability(id, from, to), retry: false });
  const d = q.data;
  return (
    <section className="container-x py-12">
      <Link to="/doctors" className="text-sm text-primary">← All doctors</Link>
      <DataState loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>
        {d && (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card p-8 lg:col-span-2">
              <div className="flex flex-wrap items-center gap-5">
                <DoctorAvatar name={d.name} url={d.imageUrl} size={96} />
                <div>
                  <h1 className="font-display text-3xl font-semibold text-primary-deep">{d.name}</h1>
                  <p className="text-primary">{d.specialization}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase size={14} />{d.experienceYears} years</span>
                  </div>
                </div>
              </div>
              <h2 className="mt-8 font-semibold text-primary-deep">About</h2>
              <p className="mt-2 text-muted-foreground">{d.bio || "No biography provided."}</p>
            </div>
            <aside className="card h-fit p-6">
              <p className="text-sm text-muted-foreground">Consultation fee</p>
              <p className="text-3xl font-bold text-primary-deep">₹{d.fee}</p>
              <h3 className="mt-6 flex items-center gap-2 font-semibold"><Clock size={16} />Next 2 weeks</h3>
              <DataState loading={av.isLoading} error={av.error} empty={!av.data?.length} emptyText="No slots published.">
                <ul className="mt-3 space-y-2 text-sm">
                  {av.data?.map((s) => <li key={s.id} className="flex justify-between rounded-lg bg-secondary px-3 py-2"><span>{fmt(s.startsAt)}</span><span>– {fmtTime(s.endsAt)}</span></li>)}
                </ul>
              </DataState>
              <Link to="/book" search={{ doctorId: d.id }} className="btn btn-primary mt-6 w-full"><CalendarCheck size={16} />Book appointment</Link>
            </aside>
          </div>
        )}
      </DataState>
    </section>
  );
}
