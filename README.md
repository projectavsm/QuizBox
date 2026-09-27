# 📦 QuizBox — Privacy-First Local MCQ Examination Engine

**QuizBox** is a lightweight, zero-cost, privacy-focused online Multiple Choice Question (MCQ) examination platform built with Next.js, SQLite, and Prisma. It allows schools, teachers, and institutions to conduct digital tests locally on a single laptop without exposing student data to third-party cloud services or incurring server costs.

The platform includes a real-time student test engine featuring a paginated question palette, global countdown timer, server-side auto-grading, and an administrative dashboard for monitoring results and exporting data to CSV/Excel.

---

## ✨ Key Features

### 🎓 Student Exam Engine
* **Instant Registration**: Clean onboarding requesting Full Name, Class, Section, and Roll Number.
* **Paginated Question Interface**: Displays one question at a time with "Previous" and "Next" controls.
* **Interactive Question Palette**: Side/top navigation grid showing color-coded status for each question:
  * 🟢 **Answered** (Green)
  * 🟡 **Marked for Review** (Yellow/Orange)
  * ⚪ **Unanswered** (Gray)
  * 🔵 **Current Question** (Blue)
* **Unrestricted Navigation**: Students can skip questions, mark items for review, or navigate freely without being forced to pick an answer immediately.
* **Sticky Global Timer**: Countdown timer pinned to the top of the screen that automatically submits student responses when time expires (`00:00`).

### 🛡️ Privacy & Anti-Cheating Architecture
* **100% Local Database**: All student data, questions, and scores remain stored locally on your hard drive inside a single SQLite file (`dev.db`). No cloud databases (e.g., Supabase, Firebase) are used.
* **Server-Side Grading**: Correct answer keys (`correctOption`) are kept strictly on the backend and are **never** transmitted to client browser bundles or Developer Tools.
* **Session Lockout**: Session tokens and unique database constraints prevent students from re-registering or retaking an exam once submitted.
* **Telemetry Disabled**: Next.js telemetry is explicitly turned off to prevent outbound diagnostic traffic.

### 📊 Admin Dashboard & Results
* **Real-Time Analytics**: View live metrics including Total Questions, Total Submissions, and Exam Duration.
* **Automated Evaluation**: Answers are graded instantly upon submission; no manual grading is required.
* **Data Export**: Single-click export of complete student results to `.csv` or `.xlsx` files.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | Combined React frontend and Node.js server API routes |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Responsive utility-first UI styling |
| **Database** | [SQLite](https://www.sqlite.org/) | Offline zero-configuration relational database file |
| **ORM** | [Prisma](https://www.prisma.io/) | Type-safe database client and migrations |
| **Tunneling** | [ngrok](https://ngrok.com/) | Secure public HTTPS tunnel to share local port 3000 |

---

## 📂 Project Directory Structure

```text
QuizBox/
├── prisma/
│   └── schema.prisma         # SQLite models (Student, Question, Submission, Settings)
├── public/                   # Static assets
├── src/
│   ├── actions/              # Next.js Server Actions
│   │   ├── admin.ts          # Question import, settings, export logic
│   │   ├── exam.ts           # Question fetching & server-side grading engine
│   │   └── student.ts        # Student registration & cookie session lock
│   ├── app/                  # App Router Pages
│   │   ├── page.tsx          # Student Registration Form
│   │   ├── test/
│   │   │   └── page.tsx      # Paginated Exam Interface with Question Palette
│   │   ├── result/
│   │   │   └── page.tsx      # Exam Completion Confirmation Screen
│   │   └── admin/
│   │       ├── page.tsx      # Dashboard & Submissions Overview
│   │       ├── questions/    # Question Bank Management
│   │       └── export/       # CSV Export API Route
│   ├── components/           # Reusable UI & Exam Components
│   │   ├── ExamHeader.tsx    # Sticky Countdown Timer
│   │   ├── QuestionPalette.tsx # 1-to-N Interactive Status Grid
│   │   └── QuestionView.tsx  # Option Selector Card
│   ├── lib/
│   │   ├── prisma.ts         # Prisma Client Singleton Instance
│   │   ├── parser.ts         # CSV Question File Reader
│   │   └── utils.ts          # Time formatting & helper functions
│   └── types/
│       └── index.ts          # Shared TypeScript Interfaces
├── .env                      # Local environment configuration
├── next.config.js            # Next.js config
├── package.json              # Dependencies & run scripts
└── tsconfig.json             # TypeScript compiler rules
🚀 Getting Started (Local Development)
Prerequisites
Node.js: v18.0.0 or higher

npm: v9.0.0 or higher

1. Installation
Clone or download the project folder, open your terminal, and install dependencies:

Bash
cd QuizBox
npm install
2. Database Initialization
Set up the local SQLite database using Prisma:

Bash
npx prisma db push
npx prisma generate
3. Disable Telemetry & Run Development Server
Start Next.js bound to network interface 0.0.0.0 so it can accept incoming local or tunneled connections:

Bash
# Disable Next.js diagnostic data collection
npx next telemetry disable

# Launch dev server on local port 3000
npm run dev
Visit the application locally in your browser:

Student Registration: http://localhost:3000

Admin Dashboard: http://localhost:3000/admin

🌐 Hosting via ngrok (Sharing with Students)
To host an exam temporarily from your laptop so students can join using their mobile phones or computers:

Install ngrok (if not already installed):

PowerShell
winget install ngrok.ngrok
Authenticate ngrok (one-time setup):

PowerShell
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
Start the Tunnel:
With your Next.js app running (npm run dev), open a second terminal and run:

PowerShell
ngrok http 3000
Distribute Link:
Copy the https://xxxx.ngrok-free.app forwarding link generated by ngrok and share it with students (or convert it into a QR code for quick mobile scanning).

Note (Offline Alternative): If all students are connected to the same Wi-Fi router, you can skip ngrok entirely. Students can access the exam directly using your laptop's local IP address (e.g., http://192.168.1.71:3000).

🗃️ Database Schema Overview
Code snippet
model Settings {
  id              Int     @id @default(1)
  examTitle       String  @default("General Examination")
  durationMinutes Int     @default(30)
  isExamActive    Boolean @default(true)
}

model Student {
  id          Int         @id @default(autoincrement())
  name        String
  gradeClass  String
  section     String
  rollNumber  String
  createdAt   DateTime    @default(now())
  submission  Submission?

  @@unique([rollNumber, gradeClass, section])
}

model Question {
  id            Int      @id @default(autoincrement())
  questionText  String
  optionA       String
  optionB       String
  optionC       String
  optionD       String
  correctOption String   // "A", "B", "C", or "D" (Evaluated strictly on server)
  createdAt     DateTime @default(now())
}

model Submission {
  id          Int      @id @default(autoincrement())
  studentId   Int      @unique
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  score       Int
  total       Int
  answersJson String   // JSON string of user choices: {"1": "A", "2": "C"}
  submittedAt DateTime @default(now())
}
🗺️ Project Roadmap & Next Steps
[x] Core System Setup: Next.js, Prisma, SQLite, and Tailwind CSS configuration.

[x] Paginated Exam Engine: Interactive Question Palette, Sticky Global Countdown Timer, and Mark for Review.

[x] Automated Evaluation: Server-side grading, session locks, and CSV results export.

[ ] Stage 1 — Manual Question Builder: Interactive UI modal on /admin/questions for adding/editing individual questions without spreadsheets.

[ ] Stage 2 — Smart Document Parser: Native parsing engine for uploading .pdf / .docx files or pasting unformatted text with live regex preview.

[ ] Stage 3 — Advanced Controls & Security:

Global scheduled exam start/end windows.

Per-question individual countdown timers.

Question and option order shuffling (anti-cheating).

Class/Subject multi-exam segregation.

📄 License
Privately owned and licensed for local educational usage.