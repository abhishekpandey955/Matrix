import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { doctorApi } from "@/lib/api";
import { DataState, PageHero, meta } from "@/components/site";
import { DoctorCard } from "@/components/DoctorCard";

export const Route = createFileRoute("/doctors/")({
  validateSearch: z.object({ search: z.string().optional(), specialization: z.string().optional() }),
  head: () => meta("Find a doctor", "Search MediCare doctors by name and filter by specialization."),
  component: Doctors,
});

const fallbackSpecs = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Ophthalmology", "Dentistry", "General Medicine", "Dermatology"];

function Doctors() {
  const { search = "", specialization = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/doctors/" });
  const [text, setText] = useState(search);
  const q = useQuery({ queryKey: ["doctors", search, specialization], queryFn: () => doctorApi.list({ search, specialization }), retry: false });
  // Backend has no specializations endpoint: merge names seen in results with the common list.
  const specList = Array.from(new Set([...fallbackSpecs, ...(q.data?.flatMap((d) => d.specializations) ?? [])]));

  return (
    <>
      <PageHero eyebrow="Doctors" title="Find the right specialist for you.">
        <form onSubmit={(e) => { e.preventDefault(); navigate({ search: (p) => ({ ...p, search: text || undefined }) }); }}
          className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search by doctor name…" className="field pl-10" />
          </div>
          <select value={specialization} onChange={(e) => navigate({ search: (p) => ({ ...p, specialization: e.target.value || undefined }) })} className="field sm:w-56">
            <option value="">All specializations</option>
            {specList.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary">Search</button>
        </form>
      </PageHero>
      <section className="container-x py-12">
        <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} emptyText="No doctors match your search." onRetry={() => q.refetch()}>
          <p className="mb-5 text-sm text-muted-foreground">{q.data?.length} doctors found</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{q.data?.map((d) => <DoctorCard key={d.id} d={d} />)}</div>
        </DataState>
      </section>
    </>
  );
}
