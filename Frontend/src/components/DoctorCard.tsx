import { Link } from "@tanstack/react-router";
import { Star, Briefcase } from "lucide-react";
import type { Doctor } from "@/lib/api";
import { DoctorAvatar } from "./site";

export function DoctorCard({ d }: { d: Doctor }) {
  return (
    <div className="card flex flex-col p-5 transition hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <DoctorAvatar name={d.name} url={d.imageUrl} />
        <div>
          <h3 className="font-semibold text-primary-deep">{d.name}</h3>
          <p className="text-sm text-primary">{d.specialization}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Briefcase size={14} />{d.experienceYears} yrs</span>
        {d.rating != null && <span className="flex items-center gap-1"><Star size={14} className="text-warning" />{d.rating.toFixed(1)}</span>}
        <span className="ml-auto font-semibold text-primary-deep">₹{d.fee}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link to="/doctors/$id" params={{ id: d.id }} className="btn btn-outline">Profile</Link>
        <Link to="/book" search={{ doctorId: d.id }} className="btn btn-primary">Book</Link>
      </div>
    </div>
  );
}
