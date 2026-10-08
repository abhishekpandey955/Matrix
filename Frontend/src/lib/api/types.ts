/* Frontend view models. Backend DTOs (from the Spring Boot OpenAPI spec) are mapped into these in ./index.ts. */
export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export interface User { id: string; name: string; email: string; role: Role }

/** Backend: AuthResponse */
export interface AuthResponse { accessToken: string; tokenType?: string; expiresAt?: string; role: string }

export interface Doctor {
  id: string; name: string; email?: string | undefined; specialization: string; specializations: string[];
  experienceYears: number; fee: number; bio?: string | undefined; phone?: string | undefined; licenseNumber?: string | undefined; approved?: boolean | undefined;
  rating?: number | undefined; qualifications?: string | undefined; imageUrl?: string | undefined; hospital?: string | undefined;
}

export interface AvailabilitySlot { id: string; doctorId?: string; startsAt: string; endsAt: string }

export interface Patient { id: string; name: string; email: string; phone?: string; dateOfBirth?: string; address?: string }

export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export interface Appointment {
  id: string; doctorId: string; doctorName: string; patientId: string; patientName: string;
  startsAt: string; endsAt: string; date: string; time: string; status: AppointmentStatus;
  specialization?: string; reason?: string;
}

export interface Prescription {
  id: string; appointmentId: string; doctorName: string; medicationName: string; dosage: string;
  frequency: string; instructions: string; validUntil?: string; issuedAt: string;
}
export interface PrescriptionCreate { medicationName: string; dosage: string; frequency: string; instructions: string; validUntil?: string }

export interface AdminDoctor { id: string; email: string; fullName: string; licenseNumber: string; approved: boolean; specializations: string[] }
export interface AdminPatient { id: string; email: string; fullName: string; phone?: string }
export interface PlatformStats { patientCount: number; doctorCount: number; appointmentCount: number }

export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }

export interface PatientRegistration { email: string; password: string; fullName: string; phone: string; dateOfBirth: string; address: string }
