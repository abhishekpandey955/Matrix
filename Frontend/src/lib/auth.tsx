import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, doctorApi, onUnauthorized, patientApi, type PatientRegistration, type Role, type User } from "@/lib/api";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerPatient: (d: PatientRegistration) => Promise<User>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export const dashboardPath = (r: Role) => (r === "ADMIN" ? "/admin" : r === "DOCTOR" ? "/doctor" : "/patient");

/** Backend login returns only a token + role; fetch the profile to get name/id where an endpoint exists. */
async function buildUser(email: string, role: Role): Promise<User> {
  try {
    if (role === "PATIENT") { const p = await patientApi.me(); return { id: p.id, name: p.name, email: p.email, role }; }
    if (role === "DOCTOR") { const d = await doctorApi.me(); return { id: d.id, name: d.name, email: d.email ?? email, role }; }
  } catch { /* fall through */ }
  return { id: "", name: email, email, role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Token is memory-only and the backend has no "current user" endpoint, so there is no session to restore.
  const ready = true;

  useEffect(() => {
    onUnauthorized(() => setUser(null));
    return () => onUnauthorized(null);
  }, []);

  const login = async (email: string, password: string) => {
    const { role } = await authApi.login(email, password);
    const u = await buildUser(email, role);
    setUser(u);
    return u;
  };
  const registerPatient = async (d: PatientRegistration) => {
    const { role } = await authApi.registerPatient(d);
    const u = await buildUser(d.email, role);
    setUser(u);
    return u;
  };
  const logout = async () => {
    authApi.logout();
    setUser(null);
  };
  return <Ctx.Provider value={{ user, ready, login, registerPatient, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
