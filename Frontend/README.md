# MediCare — Frontend

React web application for the MediCare healthcare management system.  
Built with TanStack Start (SSR), TypeScript, Tailwind CSS v4, and Bun.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [TanStack Start](https://tanstack.com/start) | SSR framework with file-based routing |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS v4 | Utility-first styling |
| [TanStack Query](https://tanstack.com/query) | Server state & data fetching |
| Radix UI + shadcn/ui | Accessible UI component library |
| Vitest + Testing Library | Unit & component testing |
| Bun | Fast package manager and runtime |

---

## Prerequisites

You need the following installed before you start:

### 1. Node.js 22 (via nvm — recommended)
```sh
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

# Install and use Node 22
nvm install 22
nvm use 22

# Verify
node --version   # v22.x.x
```

### 2. Bun
```sh
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Verify
bun --version    # 1.x.x
```

> **Note:** Every new terminal needs `source ~/.bashrc` to load bun and nvm, unless you restart your terminal session.

---

## Local Setup & Run

### Step 1 — Clone & enter the folder
```sh
cd Medicare/Frontend
```

### Step 2 — Install dependencies
```sh
bun install
```
> Only needed once, or when you add new packages.

### Step 3 — Set up environment variables
```sh
cp .env.example .env
```

Then edit `.env`:
```env
# URL of the running Spring Boot backend
VITE_API_BASE_URL=http://localhost:8090/api

# Optional: OpenAI API key for the admin setup assistant
# AI_API_KEY=sk-...
```

> ⚠️ The backend must be running first! See `../Backend/BACKEND.md`.

### Step 4 — Start the development server
```sh
bun run dev
```

✅ App is at **http://localhost:8080**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ Yes | Backend API base URL, e.g. `http://localhost:8090/api` |
| `AI_API_KEY` | ❌ Optional | OpenAI-compatible API key for the admin setup AI assistant |

> Never commit your `.env` file — it is in `.gitignore`.

---

## Available Commands

Run all commands from the `Frontend/` folder:

| Command | What it does |
|---|---|
| `bun install` | Install all dependencies |
| `bun run dev` | Start dev server at `http://localhost:8080` |
| `bun run build` | Build for production |
| `bun run preview` | Preview the production build locally |
| `bun run test` | Run all unit tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Check code with ESLint |
| `bun run format` | Auto-format code with Prettier |

---

## Troubleshooting

### `bun: command not found`
```sh
# Reload your shell config
source ~/.bashrc
# OR use the full path
~/.bun/bin/bun run dev
```

### `bun run dev` fails with Node error
```sh
# Make sure you're using Node 22
source ~/.bashrc
nvm use 22
node --version   # must be v22.x.x
bun run dev
```

### API calls fail / 404 on doctor search
- Make sure the **backend Docker container is running** (see `../Backend/BACKEND.md`)
- Check your `.env` has `VITE_API_BASE_URL=http://localhost:8090/api`
- Restart `bun run dev` after editing `.env`

### CORS error in browser console
- Make sure `CORS_ALLOWED_ORIGINS=http://localhost:8080` is set in the backend `.env`
- Restart the Docker containers after changing backend `.env`

---

## Project Structure

```
src/
├── components/          # Shared UI components
│   ├── DashShell.tsx    # Dashboard layout wrapper
│   ├── DoctorCard.tsx   # Doctor listing card
│   ├── site.tsx         # Header, footer, page layout helpers
│   └── ui/              # shadcn/ui primitives (Button, Dialog, etc.)
├── hooks/               # Custom React hooks
├── lib/
│   ├── api/             # API client + domain-specific request functions
│   ├── auth.tsx         # Auth context & RequireRole guard
│   ├── error-reporting.ts  # Error boundary reporting
│   ├── redact.ts        # Secret-redaction for admin assistant
│   └── utils.ts         # Class name utilities
├── routes/
│   ├── __root.tsx       # App shell (layout, providers, error boundary)
│   ├── index.tsx        # Home page (/)
│   ├── login.tsx        # Login page
│   ├── register.tsx     # Registration
│   ├── about.tsx        # About page
│   ├── services.tsx     # Services page
│   ├── contact.tsx      # Contact page
│   ├── doctors/         # Doctor listing and profile pages
│   ├── patient.tsx      # Patient dashboard
│   ├── doctor.tsx       # Doctor dashboard
│   ├── admin.tsx        # Admin dashboard
│   ├── admin-setup.tsx  # AI-powered admin setup assistant
│   ├── appointments.tsx # Appointments view
│   ├── prescriptions.tsx # Prescriptions view
│   └── api/             # Server-side API route handlers
└── styles.css           # Global styles and Tailwind theme tokens
```

---

## Architecture Notes

- All backend HTTP calls go through `src/lib/api/` — one central place matching Spring controllers
- JWT tokens are **in memory only** — never written to `localStorage`
- Route access gated by `RequireRole` using roles `PATIENT`, `DOCTOR`, `ADMIN`
- The only server-side code is `src/routes/api/admin-setup-guide.ts` — keeps `AI_API_KEY` server-side
