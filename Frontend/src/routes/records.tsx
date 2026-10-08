import { createFileRoute, Link } from "@tanstack/react-router";
import { Notice, RequireRole, meta } from "@/components/site";
import { DashShell } from "@/components/DashShell";

export const Route = createFileRoute("/records")({
  head: () => meta("Medical records", "Your full medical history in one secure timeline."),
  component: () => <RequireRole roles={["PATIENT"]}><Records /></RequireRole>,
});

/* The MediCare backend intentionally does not expose medical records yet (see its API description). */
function Records() {
  return (
    <DashShell title="Medical history">
      <Notice kind="info">Medical records are not available online yet. Your appointments and prescriptions are shown on their own pages.</Notice>
      <div className="mt-6 flex gap-3">
        <Link to="/appointments" className="btn btn-outline">My appointments</Link>
        <Link to="/prescriptions" className="btn btn-primary">My prescriptions</Link>
      </div>
    </DashShell>
  );
}
