# QuizBox

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma)
![License](https://img.shields.io/badge/license-private-lightgrey)

Real-time classroom exam management for local networks and temporary public tunnels. QuizBox provides a student exam client, server-side grading, protected administration, live submission monitoring, and CSV/PDF exports while keeping application data in a local SQLite database.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| Development tooling | Turbopack via Next.js 16 |
| UI | React 19, TypeScript 7 |
| Data access | Prisma 5 |
| Database | SQLite |
| Styling | Tailwind CSS 4 |
| Remote access | Cloudflare Tunnel via `cloudflared` |
| Document imports | CSV/XLSX, PDF, DOCX, TXT |

## Features

### Student Exam Client

- One-question-at-a-time exam flow with navigation and question palette.
- Countdown timer with automatic submission when time expires.
- Anti-cheat window blur and tab visibility tracking persisted as `warningCount`.
- Deterministic question ordering and client-side option presentation shuffling.
- Submission retry resilience with three attempts and exponential backoff: 1 second, then 2 seconds.

### Admin Live Dashboard

- Manual live-stat refresh to avoid unnecessary tunnel traffic and polling bottlenecks.
- Submission inspector with score, warning count, selected answers, correct answers, and per-question right/wrong indicators.
- Question bank management with CSV, XLSX, PDF, DOCX, TXT, and manual entry workflows.
- CSV export and printable PDF summary views.

### Authentication and Security

- Admin authentication through `middleware.ts` and `/api/admin/login`.
- HTTP-only session cookies for admin and student sessions.
- Server-side answer-key access and grading; correct answers are excluded from student question payloads.
- Prisma uniqueness constraint prevents duplicate student registrations for the same roll number, class, and section.

### Tunnel Networking

- Next.js binds to `0.0.0.0` for LAN access.
- `allowedDevOrigins` includes Cloudflare Tunnel origins and common local tunnel domains.
- Manual dashboard refresh and submission retries reduce avoidable tunnel load during live exams.

## Prerequisites

- Node.js 20.9 or newer (required by Next.js 16).
- npm 10 or newer.
- `cloudflared` available through `npx` for tunnel deployment.
- Windows PowerShell for the repository's output-filtering `tunnel` script, or run `cloudflared` directly on another shell.

## Environment Setup

Create `.env` in the repository root. Do not commit real secrets.

```env
DATABASE_URL="file:./dev.db"
QUIZBOX_ADMIN_SECRET="replace-with-a-long-random-admin-secret"
QUIZBOX_SHUFFLE_SECRET="replace-with-a-long-random-shuffle-secret"
LOG_QUERIES="false"
```

`DATABASE_URL` is resolved relative to the Prisma schema directory. SQLite files and environment files are excluded by `.gitignore`.

## Installation and Quickstart

```powershell
git clone <repository-url>
cd QuizBox
npm install
```

Apply the existing Prisma migrations for a local development database:

```powershell
npm run db:migrate
```

The migration command is intended for local development. For a deployed build, use the already-reviewed migration history with:

```powershell
npx prisma migrate deploy
```

To recreate the local database from scratch, destroy all local data, and reapply migrations:

```powershell
npx prisma migrate reset
```

Start the development server:

```powershell
npm run dev
```

Open:

- Student portal: <http://localhost:3000>
- Admin login: <http://localhost:3000/admin/login>
- Admin dashboard: <http://localhost:3000/admin>
- Printable report: <http://localhost:3000/admin/export-pdf>

Production smoke build:

```powershell
npm run build
npm run start
```

## Live Classroom Deployment

Start QuizBox first, then open a second PowerShell terminal and create a temporary HTTPS tunnel:

```powershell
npm run dev
```

```powershell
npm run tunnel
```

The script prints a URL similar to:

```text
https://random-name.trycloudflare.com
```

Share that `.trycloudflare.com` URL with students. They can open it from any device with internet access. Keep the development server and tunnel terminal running for the entire exam session.

For a non-PowerShell shell, run the tunnel directly:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Cloudflare Quick Tunnels are temporary and intended for classroom sessions. Use an authenticated, named Cloudflare Tunnel and a production process manager for persistent deployments.

## Project Structure

```text
QuizBox/
├── middleware.ts                 # Admin route protection
├── prisma/
│   ├── schema.prisma             # SQLite data model
│   ├── migrations/               # Versioned database migrations
│   └── seed.ts                   # Optional seed entry point
├── public/                       # Static assets and uploaded question media
├── src/
│   ├── actions/
│   │   ├── admin.ts              # Admin actions, imports, stats, exports
│   │   ├── exam.ts               # Question delivery and server-side grading
│   │   └── student.ts            # Registration and student sessions
│   ├── app/
│   │   ├── admin/                # Admin dashboard, login, question bank
│   │   ├── api/admin/            # Admin login and upload routes
│   │   ├── result/               # Submission result page
│   │   └── test/                 # Exam route
│   ├── components/
│   │   ├── admin/                # Live monitor and submission inspector
│   │   └── exam/                 # Student exam UI
│   ├── lib/                      # Prisma, parsing, logging, utilities
│   └── types/                    # Shared TypeScript types
├── next.config.js                # Allowed tunnel origins
├── package.json                  # Scripts and dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the LAN-accessible development server |
| `npm run tunnel` | Start a filtered Cloudflare Quick Tunnel URL on PowerShell |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build on `0.0.0.0` |
| `npm run db:migrate` | Create/apply a development migration |
| `npx prisma migrate deploy` | Apply committed migrations in deployment |
| `npx prisma migrate reset` | Destructively reset and reapply the local database |

## Operational Notes

- Keep `.env`, SQLite files, uploaded student data, and admin secrets private.
- Change the admin secret before exposing the application through a tunnel.
- Use HTTPS tunnels for remote students; LAN-only sessions can use the host machine's local IP address.
- Review the admin dashboard manually during an exam rather than relying on background polling.
