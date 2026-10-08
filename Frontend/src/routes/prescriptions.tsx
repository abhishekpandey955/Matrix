import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Pill, Printer } from "lucide-react";
import { prescriptionApi } from "@/lib/api";
import { DataState, RequireRole, meta } from "@/components/site";
import { DashShell } from "@/components/DashShell";

export const Route = createFileRoute("/prescriptions")({
  head: () => meta("Prescriptions", "Digital prescriptions issued by your MediCare doctors."),
  component: () => <RequireRole roles={["PATIENT"]}><Rx /></RequireRole>,
});

function Rx() {
  const q = useQuery({ queryKey: ["rx"], queryFn: prescriptionApi.mine, retry: false });
  return (
    <DashShell title="Prescriptions">
      <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} emptyText="No prescriptions yet." onRetry={() => q.refetch()}>
        <div className="grid gap-5 md:grid-cols-2">
          {q.data?.map((p) => (
            <div key={p.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div><p className="font-semibold text-primary-deep">{p.doctorName}</p><p className="text-xs text-muted-foreground">Issued {p.issuedAt?.slice(0, 10)}</p></div>
                <button onClick={() => window.print()} className="btn btn-ghost" aria-label="Print"><Printer size={16} /></button>
              </div>
              <div className="mt-4 flex gap-3 rounded-xl bg-secondary p-3 text-sm">
                <Pill size={16} className="mt-0.5 text-primary" />
                <div><p className="font-semibold">{p.medicationName} · {p.dosage}</p><p className="text-muted-foreground">{p.frequency}</p></div>
              </div>
              {p.instructions && <p className="mt-4 text-sm text-muted-foreground">{p.instructions}</p>}
              {p.validUntil && <p className="mt-2 text-xs text-muted-foreground">Valid until {p.validUntil.slice(0, 10)}</p>}
            </div>
          ))}
        </div>
      </DataState>
    </DashShell>
  );
}
