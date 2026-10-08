import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Stethoscope, CalendarCheck, BadgeCheck, XCircle, CheckCircle2 } from "lucide-react";
import { adminApi, type AppointmentStatus } from "@/lib/api";
import { DataState, Notice, RequireRole, StatCard, StatusBadge, meta } from "@/components/site";
import { DashShell } from "@/components/DashShell";

export const Route = createFileRoute("/admin")({
  head: () => meta("Admin dashboard", "Manage doctors, patients, appointments and view platform statistics."),
  component: () => <RequireRole roles={["ADMIN"]}><AdminDash /></RequireRole>,
});

type Tab = "doctors" | "patients" | "appointments";

function AdminDash() {
  const [tab, setTab] = useState<Tab>("doctors");
  const s = useQuery({ queryKey: ["stats"], queryFn: adminApi.stats, retry: false });
  const v = (n?: number) => (s.isLoading ? "…" : s.error ? "—" : n ?? 0);
  return (
    <DashShell title="Admin dashboard">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Stethoscope />} label="Doctors" value={v(s.data?.doctorCount)} />
        <StatCard icon={<Users />} label="Patients" value={v(s.data?.patientCount)} />
        <StatCard icon={<CalendarCheck />} label="Appointments" value={v(s.data?.appointmentCount)} />
      </div>
      {s.error && <div className="mt-3"><Notice kind="error">Stats: {(s.error as Error).message}</Notice></div>}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["doctors", "patients", "appointments"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn capitalize ${tab === t ? "btn-primary" : "btn-outline"}`}>{t}</button>
        ))}
      </div>
      <div className="mt-4">{tab === "doctors" ? <ManageDoctors /> : tab === "patients" ? <ManagePatients /> : <ManageAppts />}</div>
    </DashShell>
  );
}

/** Backend supports listing doctors and approving new ones (no create/delete endpoints). */
function ManageDoctors() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-doctors"], queryFn: adminApi.doctors, retry: false });
  const approve = useMutation({ mutationFn: adminApi.approveDoctor, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-doctors"] }) });
  return (
    <div className="card p-6">
      <h2 className="font-semibold">Doctors</h2>
      {approve.error && <div className="mt-3"><Notice kind="error">{(approve.error as Error).message}</Notice></div>}
      <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} onRetry={() => q.refetch()}>
        <ul className="mt-4 divide-y text-sm">
          {q.data?.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-3">
              <div><p className="font-semibold">{d.fullName}</p><p className="text-muted-foreground">{d.email} · {d.specializations.join(", ")} · Licence {d.licenseNumber}</p></div>
              {d.approved
                ? <span className="inline-flex items-center gap-1 text-success"><BadgeCheck size={16} />Approved</span>
                : <button onClick={() => approve.mutate(d.id)} disabled={approve.isPending} className="btn btn-primary px-3">Approve</button>}
            </li>
          ))}
        </ul>
      </DataState>
    </div>
  );
}

function ManagePatients() {
  const q = useQuery({ queryKey: ["admin-patients"], queryFn: adminApi.patients, retry: false });
  return (
    <div className="card p-6">
      <h2 className="font-semibold">Patients</h2>
      <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} onRetry={() => q.refetch()}>
        <ul className="mt-4 divide-y text-sm">
          {q.data?.map((p) => (
            <li key={p.id} className="py-3"><p className="font-semibold">{p.fullName}</p><p className="text-muted-foreground">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p></li>
          ))}
        </ul>
      </DataState>
    </div>
  );
}

function ManageAppts() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-appts"], queryFn: adminApi.appointments, retry: false });
  const set = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => adminApi.setAppointmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-appts"] }),
  });
  return (
    <div className="card overflow-x-auto p-6">
      <h2 className="font-semibold">Appointments</h2>
      {set.error && <div className="mt-3"><Notice kind="error">{(set.error as Error).message}</Notice></div>}
      <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} onRetry={() => q.refetch()}>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Patient</th><th>Doctor</th><th>When</th><th>Status</th><th></th></tr></thead>
          <tbody className="divide-y">
            {q.data?.map((a) => (
              <tr key={a.id}>
                <td className="py-3">{a.patientName}</td><td>{a.doctorName}</td><td>{a.date} {a.time}</td><td><StatusBadge status={a.status} /></td>
                <td className="space-x-1 text-right">
                  {a.status === "PENDING" && <button onClick={() => set.mutate({ id: a.id, status: "CONFIRMED" })} className="btn btn-outline px-3"><CheckCircle2 size={14} />Confirm</button>}
                  {(a.status === "PENDING" || a.status === "CONFIRMED") && <button onClick={() => set.mutate({ id: a.id, status: "CANCELLED" })} className="btn btn-danger px-3"><XCircle size={14} />Cancel</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataState>
    </div>
  );
}
