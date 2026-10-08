<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Backend is an external Java Spring Boot REST API; all HTTP goes through `src/lib/api/` (client.ts + domain APIs) using `VITE_API_BASE_URL`. Why: one place to match Spring controllers.
- No Supabase/Firebase/Node backend and no mock responses; screens show loading/error/empty states. Why: user requirement.
- Auth token lives in memory only (plus cookie credentials); never store passwords or medical data in localStorage. Why: security requirement.
- Role gating via `RequireRole` + `AuthProvider` (`/auth/me`) for PATIENT/DOCTOR/ADMIN. Why: ready for Spring Security roles.
- The only in-app server code is `src/routes/api/admin-setup-guide.ts`, which calls Lovable AI Gateway; all medical/business data still goes to the Spring backend. Why: the AI key must stay server-side.
