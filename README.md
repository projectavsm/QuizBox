📦 QuizBox — Privacy-First Local MCQ Examination EngineQuizBox is a lightweight, zero-cost, privacy-focused online Multiple Choice Question (MCQ) examination platform built with Next.js, SQLite, and Prisma. It allows schools, teachers, and institutions to conduct digital tests locally on a single laptop without exposing student data to third-party cloud services or incurring server costs.The platform includes a real-time student test engine with question palette controls, a sticky global countdown timer, server-side auto-grading, a Live Admin Monitoring Dashboard, Question Diagram/Media Support, and comprehensive CSV/PDF export options.✨ Key Features🎓 Student Exam EngineInstant Registration: Clean onboarding requesting Full Name, Class, Section, and Roll Number.Paginated Question Interface: Displays one question at a time with "Previous" and "Next" navigation controls.Question Media Support: Fully supports uploading and displaying inline images, formulas, and diagrams along with question text.Interactive Question Palette: Side/top navigation grid showing color-coded status for each question:🟢 Answered (Green)🟡 Marked for Review (Yellow/Orange)⚪ Unanswered (Gray)🔵 Current Question (Blue)Unrestricted Navigation: Students can skip questions, mark items for review, or navigate freely without being forced to answer immediately.Sticky Global Timer: Countdown timer pinned to the top of the screen that automatically submits student responses when time expires (00:00).📊 Live Admin Monitoring & AnalyticsReal-Time Live Feed: Auto-refreshing admin dashboard tracking connected students, live completion rates, and recent submissions in real time.Key Metrics Summary: Instant calculation of total registered students, total completed exams, average class scores, and highest score.Automated Evaluation: Answers are graded instantly upon submission with zero manual grading required.Multi-Format Export Options: Export complete results to .csv spreadsheets or print formatted PDF Summary Reports complete with summary metrics.🛡️ Privacy & Anti-Cheating Architecture100% Local Storage: All student data, uploaded images, questions, and scores remain stored locally on your hard drive inside SQLite (dev.db) and local directories (/public/uploads/). No cloud services (e.g., Supabase, Firebase) are used.Server-Side Grading: Answer keys (correctOption) remain strictly on the server and are never exposed in client JavaScript bundles or browser Developer Tools.Session Lockout: Cookie-based session tokens and database constraints prevent students from re-registering or retaking an exam once submitted.Telemetry Disabled: Next.js diagnostic data collection is explicitly turned off to ensure zero outbound network traffic.🛠️ Tech Stack & ArchitectureLayerTechnologyPurposeFrameworkNext.js 16 (App Router)Combined React frontend, Server Actions, and API routesLanguageTypeScriptEnd-to-end type safetyStylingTailwind CSSUtility-first responsive styling and print layoutsDatabaseSQLiteOffline zero-configuration relational databaseORMPrismaType-safe database client and schema migrationsMedia HandlingNode.js fs / pathLocal filesystem storage for uploaded question diagramsTunnelingngrokSecure public HTTPS tunnel for hosting exams locally📂 Project Directory StructurePlaintextQuizBox/
├── prisma/
│   └── schema.prisma         # SQLite models (Student, Question, Submission, Settings)
├── public/
│   └── uploads/
│       └── questions/        # Local disk storage for question images & diagrams
├── src/
│   ├── actions/              # Next.js Server Actions
│   │   ├── admin.ts          # Question import, settings, live monitoring, PDF exports
│   │   ├── exam.ts           # Question fetching & server-side grading engine
│   │   └── student.ts        # Student registration & cookie session lock
│   ├── app/                  # App Router Pages
│   │   ├── page.tsx          # Student Registration Form
│   │   ├── test/
│   │   │   └── page.tsx      # Paginated Exam Interface with Question Palette & Media
│   │   ├── result/
│   │   │   └── page.tsx      # Exam Completion Confirmation Screen
│   │   ├── admin/
│   │   │   ├── page.tsx      # Live Admin Monitoring Dashboard
│   │   │   ├── questions/    # Question Bank Management & Image Uploader
│   │   │   └── export-pdf/   # Printable PDF Summary Report View
│   │   └── api/
│   │       └── admin/
│   │           ├── export/        # CSV Export Route
│   │           └── upload-image/  # Image upload handler API
│   ├── components/           # Reusable UI & Exam Components
│   │   ├── admin/
│   │   │   └── LiveMonitor.tsx    # Real-time auto-polling monitoring widget
│   │   ├── ExamHeader.tsx    # Sticky Countdown Timer
│   │   ├── QuestionPalette.tsx# Status Grid Component
│   │   └── QuestionView.tsx  # Question Display with Image Rendering
│   ├── lib/
│   │   ├── prisma.ts         # Prisma Client Singleton
│   │   ├── parser.ts         # CSV Question Reader
│   │   └── utils.ts          # Time formatting & helper functions
│   └── types/
│       └── index.ts          # Shared TypeScript Interfaces
├── .env                      # Local environment configuration
├── next.config.js            # Next.js configuration
├── package.json              # Project dependencies & scripts
└── tsconfig.json             # TypeScript compiler settings
🚀 Getting Started (Local Development)PrerequisitesNode.js: v18.0.0 or highernpm: v9.0.0 or higher1. InstallationClone or download the project repository, navigate into the directory, and install dependencies:Bashcd QuizBox
npm install
2. Database Setup & MigrationsInitialize your local SQLite database using Prisma:Bashnpx prisma migrate dev --name init
npx prisma generate
3. Disable Telemetry & Run Development ServerStart Next.js bound to network interface 0.0.0.0 so local network devices can connect:Bash# Disable diagnostic telemetry collection
npx next telemetry disable

# Launch development server on local port 3000
npm run dev
Visit the application locally in your browser:Student Exam Portal: http://localhost:3000Live Admin Dashboard: http://localhost:3000/adminPrintable PDF Export: http://localhost:3000/admin/export-pdf🌐 Hosting via ngrok (Sharing with Students)To host an exam temporarily from your laptop so students can join using mobile phones or laptops over the internet:Install ngrok (if not already installed):PowerShellwinget install ngrok.ngrok
Authenticate ngrok (one-time setup):PowerShellngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
Start the Tunnel:With your Next.js app running (npm run dev), open a second terminal window and run:PowerShellngrok http 3000
Distribute Link:Copy the [https://xxxx.ngrok-free.app](https://xxxx.ngrok-free.app) forwarding address generated by ngrok and share it with students (or turn it into a QR code for quick scanning).Offline Alternative: If all student devices are connected to the same Wi-Fi network, you can skip ngrok. Students can access the portal directly using your laptop's local IP address (e.g., [http://192.168.1.71:3000](http://192.168.1.71:3000)).🗃️ Database Schema OverviewCode snippetmodel Settings {
  id              Int     @id @default(1)
  examTitle       String  @default("General Examination")
  durationMinutes Int     @default(30)
  isExamActive    Boolean @default(true)
}

model Student {
  id         Int         @id @default(autoincrement())
  name       String
  gradeClass String
  section    String
  rollNumber String
  createdAt  DateTime    @default(now())
  submission Submission?

  @@unique([rollNumber, gradeClass, section])
}

model Question {
  id            Int      @id @default(autoincrement())
  questionText  String
  imageUrl      String?  // Relative path e.g. "/uploads/questions/171000_diagram.png"
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
📄 LicensePrivately owned and licensed for local educational usage.