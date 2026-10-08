import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, FileText, Pill, Save } from "lucide-react";
import { appointmentApi, patientApi } from "@/lib/api";
import { DataState, Notice, RequireRole, StatCard, StatusBadge, meta } from "@/components/site";
import { DashShell } from "@/components/DashShell";

export const Route = createFileRoute("/patient")({
  head: () => meta("Patient dashboard", "Your appointments, records and profile at a glance."),
  component: () => <RequireRole roles={["PATIENT"]}><PatientDash /></RequireRole>,
});

function PatientDash() {
  const appts = useQuery({ queryKey: ["my-appts"], queryFn: appointmentApi.mine, retry: false });
  const upcoming = appts.data?.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED") ?? [];
  return (
    <DashShell title="My health">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarCheck />} label="Upcoming" value={appts.isLoading ? "…" : upcoming.length} />
        <Link to="/records"><StatCard icon={<FileText />} label="Medical records" value="View" /></Link>
        <Link to="/prescriptions"><StatCard icon={<Pill />} label="Prescriptions" value="View" /></Link>
      </div>
      <div className="card mt-6 p-6">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Upcoming appointments</h2><Link to="/book" className="btn btn-primary">Book new</Link></div>
        <DataState loading={appts.isLoading} error={appts.error} empty={!upcoming.length} emptyText="No upcoming appointments." onRetry={() => appts.refetch()}>
          <ul className="mt-4 divide-y">
            {upcoming.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div><p className="font-semibold">{a.doctorName}</p><p className="text-muted-foreground">{a.date} · {a.time}</p></div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </DataState>
      </div>
      <ProfileForm />
    </DashShell>
  );
}

function ProfileForm() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["me-patient"], queryFn: patientApi.me, retry: false });
  const [ok, setOk] = useState(false);
  const m = useMutation({
    mutationFn: (p: { fullName?: string; phone?: string; dateOfBirth?: string; address?: string }) => patientApi.updateMe(p),
    onSuccess: (d) => { qc.setQueryData(["me-patient"], d); setOk(true); },
  });
  const p = q.data;
  return (
    <div className="card mt-6 p-6">
      <h2 className="font-semibold">Edit profile</h2>
      <DataState loading={q.isLoading} error={q.error} onRetry={() => q.refetch()}>
        {p && (
          <form key={p.id} onSubmit={(e) => { e.preventDefault(); setOk(false); m.mutate(Object.fromEntries(new FormData(e.currentTarget)) as any); }} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="label">Name</label><input name="fullName" defaultValue={p.name} className="field" /></div>
            <div><label className="label">Phone</label><input name="phone" defaultValue={p.phone} className="field" /></div>
            <div><label className="label">Date of birth</label><input name="dateOfBirth" type="date" defaultValue={p.dateOfBirth} className="field" /></div>
            <div><label className="label">Email</label><input value={p.email} disabled className="field" /></div>
            <div className="sm:col-span-2"><label className="label">Address</label><input name="address" defaultValue={p.address} className="field" /></div>
            <div className="space-y-3 sm:col-span-2">
              {m.error && <Notice kind="error">{(m.error as Error).message}</Notice>}
              {ok && <Notice kind="success">Profile updated.</Notice>}
              <button disabled={m.isPending} className="btn btn-primary"><Save size={16} />{m.isPending ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        )}
      </DataState>
    </div>
  );
}
