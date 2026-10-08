import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XCircle } from "lucide-react";
import { appointmentApi } from "@/lib/api";
import { DataState, Notice, RequireRole, StatusBadge, meta } from "@/components/site";
import { DashShell } from "@/components/DashShell";

export const Route = createFileRoute("/appointments")({
  head: () => meta("My appointments", "View and cancel your MediCare appointments."),
  component: () => <RequireRole roles={["PATIENT"]}><Appts /></RequireRole>,
});

function Appts() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["my-appts"], queryFn: appointmentApi.mine, retry: false });
  const cancel = useMutation({ mutationFn: appointmentApi.cancel, onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appts"] }) });
  return (
    <DashShell title="My appointments">
      {cancel.error && <div className="mb-4"><Notice kind="error">{(cancel.error as Error).message}</Notice></div>}
      <div className="card overflow-x-auto">
        <DataState loading={q.isLoading} error={q.error} empty={!q.data?.length} emptyText="You have no appointments." onRetry={() => q.refetch()}>
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground"><tr><th className="p-4">Doctor</th><th>Date</th><th>Time</th><th>Status</th><th></th></tr></thead>
            <tbody className="divide-y">
              {q.data?.map((a) => (
                <tr key={a.id}>
                  <td className="p-4"><p className="font-semibold">{a.doctorName}</p></td>
                  <td>{a.date}</td><td>{a.time}</td><td><StatusBadge status={a.status} /></td>
                  <td className="pr-4 text-right">
                    {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                      <button disabled={cancel.isPending} onClick={() => confirm("Cancel this appointment?") && cancel.mutate(a.id)} className="btn btn-danger"><XCircle size={14} />Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataState>
      </div>
      <Link to="/book" className="btn btn-primary mt-6">Book another</Link>
    </DashShell>
  );
}
