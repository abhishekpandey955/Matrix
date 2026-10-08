import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { appointmentApi, doctorApi } from "@/lib/api";
import { DataState, Notice, RequireRole, meta } from "@/components/site";
import { DashShell } from "@/components/DashShell";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ doctorId: z.string().optional() }),
  head: () => meta("Book an appointment", "Choose a doctor, date and time to book your consultation."),
  component: () => <RequireRole roles={["PATIENT"]}><Book /></RequireRole>,
});

const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const SLOT_MIN = 30;

function Book() {
  const { doctorId } = Route.useSearch();
  const docs = useQuery({ queryKey: ["doctors", "", ""], queryFn: () => doctorApi.list(), retry: false });
  const [time, setTime] = useState("");
  const m = useMutation({
    mutationFn: async (v: { doctorId: string; date: string; time: string }) => {
      const start = new Date(`${v.date}T${v.time}:00`);
      const startsAt = start.toISOString();
      const endsAt = new Date(start.getTime() + SLOT_MIN * 60000).toISOString();
      const av = await appointmentApi.checkAvailability(v.doctorId, startsAt, endsAt);
      if (!av.available) throw new Error("That time isn't available for this doctor. Please pick another slot.");
      return appointmentApi.book({ doctorId: v.doctorId, startsAt, endsAt });
    },
  });
  const today = new Date().toISOString().slice(0, 10);

  if (m.isSuccess) return (
    <DashShell title="Booked!">
      <div className="card p-10 text-center">
        <CheckCircle2 className="mx-auto text-success" size={48} />
        <p className="mt-4 font-semibold">Your appointment with {m.data.doctorName} on {m.data.date} at {m.data.time} is requested.</p>
        <Link to="/appointments" className="btn btn-primary mt-6">View my appointments</Link>
      </div>
    </DashShell>
  );

  return (
    <DashShell title="Book an appointment">
      <DataState loading={docs.isLoading} error={docs.error} empty={!docs.data?.length} emptyText="No doctors available." onRetry={() => docs.refetch()}>
        <form className="card grid gap-5 p-6" onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          m.mutate({ doctorId: String(f.get("doctorId")), date: String(f.get("date")), time });
        }}>
          <div><label className="label">Doctor</label>
            <select name="doctorId" defaultValue={doctorId ?? ""} required className="field">
              <option value="" disabled>Select a doctor</option>
              {docs.data?.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialization} (₹{d.fee})</option>)}
            </select>
          </div>
          <div><label className="label">Date</label><input name="date" type="date" min={today} required className="field sm:w-64" /></div>
          <div><label className="label">Time slot ({SLOT_MIN} min)</label>
            <div className="flex flex-wrap gap-2">
              {times.map((t) => <button type="button" key={t} onClick={() => setTime(t)} className={`btn ${time === t ? "btn-primary" : "btn-outline"}`}>{t}</button>)}
            </div>
          </div>
          {m.error && <Notice kind="error">{(m.error as Error).message}</Notice>}
          <button disabled={!time || m.isPending} className="btn btn-primary w-fit"><CalendarCheck size={16} />{m.isPending ? "Booking…" : "Confirm booking"}</button>
        </form>
      </DataState>
    </DashShell>
  );
}
