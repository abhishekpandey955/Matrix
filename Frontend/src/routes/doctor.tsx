import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, X, Plus, Trash2, CalendarCheck, Clock, CheckCircle2 } from "lucide-react";
import { appointmentApi, doctorApi, prescriptionApi, type Appointment, type AppointmentStatus, type PrescriptionCreate } from "@/lib/api";
import { DataState, Notice, RequireRole, StatCard, StatusBadge, meta } from "@/components/site";
import { DashShell } from "@/components/DashShell";

export const Route = createFileRoute("/doctor")({
  head: () => meta("Doctor dashboard", "Manage appointments, availability and prescriptions."),
  component: () => <RequireRole roles={["DOCTOR"]}><DoctorDash /></RequireRole>,
});

function DoctorDash() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["doc-appts"], queryFn: doctorApi.myAppointments, retry: false });
  const status = useMutation({
    mutationFn: ({ id, s }: { id: string; s: AppointmentStatus }) => appointmentApi.setStatus(id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-appts"] }),
  });
  const list = q.data ?? [];
  return (
    <DashShell title="Doctor dashboard">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Clock />} label="Pending requests" value={list.filter((a) => a.status === "PENDING").length} />
        <StatCard icon={<CalendarCheck />} label="Confirmed" value={list.filter((a) => a.status === "CONFIRMED").length} />
        <StatCard icon={<CheckCircle2 />} label="Completed" value={list.filter((a) => a.status === "COMPLETED").length} />
      </div>
      <div className="card mt-6 overflow-x-auto p-6">
        <h2 className="font-semibold">Appointments</h2>
        {status.error && <div className="mt-3"><Notice kind="error">{(status.error as Error).message}</Notice></div>}
        <DataState loading={q.isLoading} error={q.error} empty={!list.length} emptyText="No appointments yet." onRetry={() => q.refetch()}>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Patient</th><th>Date</th><th>Status</th><th></th></tr></thead>
            <tbody className="divide-y">
              {list.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 font-semibold">{a.patientName}</td><td>{a.date} {a.time}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="space-x-1 text-right">
                    {a.status === "PENDING" && (<>
                      <button onClick={() => status.mutate({ id: a.id, s: "CONFIRMED" })} className="btn btn-outline px-3"><Check size={14} />Confirm</button>
                      <button onClick={() => status.mutate({ id: a.id, s: "CANCELLED" })} className="btn btn-danger px-3"><X size={14} />Decline</button>
                    </>)}
                    {a.status === "CONFIRMED" && (<>
                      <button onClick={() => status.mutate({ id: a.id, s: "COMPLETED" })} className="btn btn-outline px-3">Mark done</button>
                      <button onClick={() => status.mutate({ id: a.id, s: "NO_SHOW" })} className="btn btn-ghost px-3">No-show</button>
                    </>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataState>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Availability />
        <PrescriptionForm appts={list.filter((a) => a.status === "CONFIRMED" || a.status === "COMPLETED")} />
      </div>
    </DashShell>
  );
}

const iso = (d: Date) => d.toISOString();
const fmt = (s: string) => new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

/** Availability = concrete time slots (next 30 days) stored on the backend. */
function Availability() {
  const qc = useQueryClient();
  const from = new Date(); const to = new Date(Date.now() + 30 * 864e5);
  const q = useQuery({ queryKey: ["my-availability"], queryFn: () => doctorApi.myAvailability(iso(from), iso(to)), retry: false });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-availability"] });
  const add = useMutation({ mutationFn: doctorApi.addAvailability, onSuccess: refresh });
  const del = useMutation({ mutationFn: doctorApi.removeAvailability, onSuccess: refresh });
  const [date, setDate] = useState(""); const [start, setStart] = useState("09:00"); const [end, setEnd] = useState("13:00");
  const err = (add.error || del.error) as Error | null;
  return (
    <div className="card p-6">
      <h2 className="font-semibold">Manage availability</h2>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => {
        e.preventDefault();
        add.mutate({ startsAt: iso(new Date(`${date}T${start}`)), endsAt: iso(new Date(`${date}T${end}`)) });
      }}>
        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="field" />
        <input type="time" required value={start} onChange={(e) => setStart(e.target.value)} className="field" />
        <input type="time" required value={end} onChange={(e) => setEnd(e.target.value)} className="field" />
        <button disabled={add.isPending} className="btn btn-primary"><Plus size={14} />{add.isPending ? "Adding…" : "Add slot"}</button>
      </form>
      {err && <div className="mt-3"><Notice kind="error">{err.message}</Notice></div>}
      <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} emptyText="No upcoming slots." onRetry={() => q.refetch()}>
        <ul className="mt-4 divide-y text-sm">
          {q.data?.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span>{fmt(s.startsAt)} – {new Date(s.endsAt).toLocaleTimeString([], { timeStyle: "short" })}</span>
              <button onClick={() => del.mutate(s.id)} className="btn btn-danger px-3" aria-label="Remove slot"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  );
}

const blank: PrescriptionCreate = { medicationName: "", dosage: "", frequency: "", instructions: "" };

function PrescriptionForm({ appts }: { appts: Appointment[] }) {
  const [p, setP] = useState<PrescriptionCreate>({ ...blank });
  const [apptId, setApptId] = useState("");
  const m = useMutation({
    mutationFn: () => { const { validUntil, ...rest } = p; return prescriptionApi.create(apptId, validUntil ? { ...rest, validUntil } : rest); },
    onSuccess: () => { setP({ ...blank }); setApptId(""); },
  });
  const upd = (k: keyof PrescriptionCreate, v: string) => setP((s) => ({ ...s, [k]: v }));
  return (
    <form className="card p-6" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <h2 className="font-semibold">Create prescription</h2>
      <label className="label mt-4">Appointment</label>
      <select value={apptId} onChange={(e) => setApptId(e.target.value)} required className="field">
        <option value="">Select patient appointment</option>
        {appts.map((a) => <option key={a.id} value={a.id}>{a.patientName} — {a.date}</option>)}
      </select>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input required placeholder="Medicine" value={p.medicationName} onChange={(e) => upd("medicationName", e.target.value)} className="field" />
        <input required placeholder="Dosage (e.g. 500mg)" value={p.dosage} onChange={(e) => upd("dosage", e.target.value)} className="field" />
        <input required placeholder="Frequency (e.g. twice daily)" value={p.frequency} onChange={(e) => upd("frequency", e.target.value)} className="field" />
      </div>
      <label className="label mt-3">Instructions</label>
      <textarea required value={p.instructions} onChange={(e) => upd("instructions", e.target.value)} rows={2} className="field" />
      <label className="label mt-3">Valid until (optional)</label>
      <input type="date" value={p.validUntil ?? ""} onChange={(e) => upd("validUntil", e.target.value)} className="field" />
      <div className="mt-3 space-y-3">
        {m.isSuccess && <Notice kind="success">Prescription issued.</Notice>}
        {m.error && <Notice kind="error">{(m.error as Error).message}</Notice>}
        <button disabled={m.isPending} className="btn btn-primary">{m.isPending ? "Issuing…" : "Issue prescription"}</button>
      </div>
    </form>
  );
}
