import { api, setAccessToken } from "./client";
import type {
  AdminDoctor, AdminPatient, Appointment, AppointmentStatus, AuthResponse, AvailabilitySlot, Doctor, Page,
  Patient, PatientRegistration, PlatformStats, Prescription, PrescriptionCreate, Role,
} from "./types";

export * from "./types";
export { ApiError, API_BASE_URL, onUnauthorized } from "./client";

/* Endpoints match the MediCare Spring Boot OpenAPI spec (/api/v3/api-docs). */

/* ---------- mappers: backend DTO -> frontend model ---------- */
type DoctorDto = {
  id: string; fullName: string; email?: string; phone?: string; biography?: string; yearsOfExperience?: number;
  consultationFee?: number; specializations?: string[]; licenseNumber?: string; approved?: boolean;
};
const toDoctor = (d: DoctorDto): Doctor => ({
  id: d.id, name: d.fullName, email: d.email, phone: d.phone, bio: d.biography,
  experienceYears: d.yearsOfExperience ?? 0, fee: d.consultationFee ?? 0,
  specializations: d.specializations ?? [], specialization: (d.specializations ?? []).join(", "),
  licenseNumber: d.licenseNumber, approved: d.approved,
});

type ApptDto = Omit<Appointment, "date" | "time">;
const pad = (n: number) => String(n).padStart(2, "0");
const toAppt = (a: ApptDto): Appointment => {
  const s = new Date(a.startsAt);
  return { ...a, date: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`, time: `${pad(s.getHours())}:${pad(s.getMinutes())}` };
};

type PatientDto = { id: string; email: string; fullName: string; phone?: string; dateOfBirth?: string; address?: string };
const toPatient = (p: PatientDto): Patient => ({ ...p, name: p.fullName });

export const normalizeRole = (r: string): Role => r.replace(/^ROLE_/, "").toUpperCase() as Role;

/* ---------- auth ---------- */
export const authApi = {
  async login(email: string, password: string) {
    const r = await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
    setAccessToken(r.accessToken);
    return { role: normalizeRole(r.role), expiresAt: r.expiresAt };
  },
  async registerPatient(data: PatientRegistration) {
    const r = await api<AuthResponse>("/auth/register/patient", { method: "POST", body: data });
    setAccessToken(r.accessToken);
    return { role: normalizeRole(r.role), expiresAt: r.expiresAt };
  },
  /** No logout endpoint exists (stateless JWT): discard the token locally. */
  logout() { setAccessToken(null); },
};

/* ---------- doctors ---------- */
export const doctorApi = {
  async list(q?: { search?: string; specialization?: string }) {
    const p = await api<Page<DoctorDto>>("/doctors/search", { query: { q: q?.search, specialization: q?.specialization, size: 100 } });
    return p.content.map(toDoctor);
  },
  /** Backend has no GET /doctors/{id}; look the doctor up via search. */
  async get(id: string) {
    const d = (await doctorApi.list()).find((x) => x.id === id);
    if (!d) throw new Error("Doctor not found.");
    return d;
  },
  me: async () => toDoctor(await api<DoctorDto>("/doctors/me")),
  availability: (id: string, from: string, to: string) =>
    api<AvailabilitySlot[]>(`/doctors/${id}/availability`, { query: { from, to } }),
  myAvailability: (from: string, to: string) => api<AvailabilitySlot[]>("/doctors/me/availability", { query: { from, to } }),
  addAvailability: (s: { startsAt: string; endsAt: string }) =>
    api<AvailabilitySlot>("/doctors/me/availability", { method: "POST", body: s }),
  removeAvailability: (id: string) => api<void>(`/doctors/me/availability/${id}`, { method: "DELETE" }),
  myAppointments: async () => (await api<ApptDto[]>("/doctors/me/appointments")).map(toAppt),
};

/* ---------- patients ---------- */
export const patientApi = {
  me: async () => toPatient(await api<PatientDto>("/patients/me")),
  updateMe: async (p: { fullName?: string; phone?: string; dateOfBirth?: string; address?: string }) =>
    toPatient(await api<PatientDto>("/patients/me", { method: "PATCH", body: p })),
};

/* ---------- appointments ---------- */
export const appointmentApi = {
  book: async (b: { doctorId: string; startsAt: string; endsAt: string }) =>
    toAppt(await api<ApptDto>("/appointments", { method: "POST", body: b })),
  checkAvailability: (doctorId: string, startsAt: string, endsAt: string) =>
    api<{ available: boolean }>("/appointments/availability", { query: { doctorId, startsAt, endsAt } }),
  mine: async () => (await api<ApptDto[]>("/patients/me/appointments")).map(toAppt),
  cancel: async (id: string) => toAppt(await api<ApptDto>(`/appointments/${id}/cancel`, { method: "POST" })),
  setStatus: async (id: string, status: AppointmentStatus) =>
    toAppt(await api<ApptDto>(`/appointments/${id}/status`, { method: "PATCH", body: { status } })),
};

/* ---------- prescriptions ---------- */
export const prescriptionApi = {
  mine: () => api<Prescription[]>("/patients/me/prescriptions"),
  create: (appointmentId: string, p: PrescriptionCreate) =>
    api<Prescription>(`/appointments/${appointmentId}/prescriptions`, { method: "POST", body: p }),
};

/* ---------- admin ---------- */
export const adminApi = {
  stats: () => api<PlatformStats>("/admin/statistics"),
  doctors: async () => (await api<Page<AdminDoctor>>("/admin/doctors", { query: { size: 100 } })).content,
  approveDoctor: (id: string) => api<AdminDoctor>(`/admin/doctors/${id}/approve`, { method: "POST" }),
  patients: async () => (await api<Page<AdminPatient>>("/admin/patients", { query: { size: 100 } })).content,
  appointments: async () => (await api<Page<ApptDto>>("/admin/appointments", { query: { size: 100 } })).content.map(toAppt),
  setAppointmentStatus: async (id: string, status: AppointmentStatus) =>
    toAppt(await api<ApptDto>(`/admin/appointments/${id}/status`, { method: "PATCH", body: { status } })),
};
