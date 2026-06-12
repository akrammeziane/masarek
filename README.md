# مساركَ — Masarek

> **AI-powered university orientation platform for Algerian baccalaureate students (BAC 2025)**

Masarek (مساركَ, *"your paths"*) helps Algerian high school graduates find the right university specialty and institution. It combines a **100% deterministic eligibility engine** (based on the official MESRS 2025 circulaire) with **Groq LLaMA-3.3-70b** for bilingual Arabic/French explanations.

> **There is no Python/scikit-learn microservice.** The AI service is Groq (via API), called directly from the Next.js backend. 

---

## How it actually works

```
Student fills 5-step assessment
        │
        ▼
app/actions/student.ts — saveFullAssessment()
        │
        ▼
POST /api/assessment
        │
        ├─ 1. lib/scoring.ts ──── Deterministic eligibility filter
        │        │                Implements MESRS "Moyenne Pondérée" formula
        │        │                Checks 4,719 official offerings
        │        │                → returns ≤ 25 admissible options
        │
        ├─ 2. lib/profile-fit.ts ─ Rule-based profile scorer (0–100)
        │        │                  Scores: interests (0–30) + strengths (0–25)
        │        │                  + work-env (0–8) + priorities (0–12)
        │        │                  + margin bonus (0–5) + overqualification penalty
        │
        └─ 3. Groq API (LLaMA-3.3-70b) ── Re-ranks + writes bilingual reasons
                 │                          Falls back to templated Arabic text
                 │                          if Groq is unavailable
                 ▼
        Merged results saved to DB → /results page
```

The LLM **never decides admissibility** — it only re-ranks and phrases explanations for options that have already passed the deterministic filter. Numbers are always owned by the TypeScript engine.

---

## ✨ Features

- **5-step psychometric assessment** — Interests, strengths (1–5 sliders), work environment, career priorities, and academic info.
- **Official MESRS scoring engine** — Weighted averages (`Moyenne Pondérée`) per BAC stream × domain, matching the 2025 orientation circulaire.
- **4,719 official offerings** — Every university–specialty pair with Priority 1 / 2 / 3 thresholds, loaded from `lib/data/offerings.json`.
- **Groq AI ranking** — LLaMA-3.3-70b ranks the eligible short-list and writes one Arabic + one French justification sentence per result.
- **Deterministic fallback** — If Groq is down, templated Arabic reasons are generated from the rule-based signals.
- **Rate limiting** — 2 assessments per rolling 24-hour window per student.
- **University & Specialty Explorer** — Searchable catalogue from `lib/data/universities.json` and `lib/data/specialties.json`.
- **Saved Specializations** — Bookmark and annotate results.
- **Gamification** — XP points, levels, and badges.
- **Email-verified auth** — Custom register flow (bcrypt + Resend) with NextAuth v5 JWT sessions. Google OAuth ready in code but currently disabled.
- **Admin Dashboard** — Manage universities, specialties, and offerings.
- **Bilingual RTL UI** — Arabic primary, French secondary.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| UI | shadcn/ui · Radix UI · Tailwind CSS v4 · Framer Motion |
| Forms | React Hook Form · Zod v4 |
| Data fetching | TanStack Query v5 |
| Auth | NextAuth v5 beta (JWT, Credentials + email verification) |
| ORM | Drizzle ORM (node-postgres) |
| Database | PostgreSQL |
| AI / LLM | **Groq** (`llama-3.3-70b-versatile`) via `groq-sdk` |
| Email | Resend |
| Package manager | pnpm |



---

## 📁 Project Structure

```
masarek/
├── app/
│   ├── actions/student.ts          # Server actions: saveFullAssessment, addXP, etc.
│   ├── api/
│   │   ├── assessment/route.ts     # ★ Core pipeline: scoring → profile-fit → Groq
│   │   ├── assessment/[id]/route.ts
│   │   ├── auth/
│   │   │   ├── [...all]/route.ts   # NextAuth handler
│   │   │   ├── check-email/        # DNS MX validation (disposable email blocker)
│   │   │   ├── register/           # Custom register + Resend verification email
│   │   │   └── verify-email/       # Token verification
│   │   ├── dashboard/route.ts
│   │   ├── specialties/
│   │   └── universities/
│   ├── assessment/page.tsx
│   ├── dashboard/page.tsx
│   ├── explorer/page.tsx
│   ├── forgot-password/page.tsx
│   ├── results/page.tsx
│   ├── saved/page.tsx
│   ├── settings/page.tsx
│   └── …                           # Auth pages, onboarding, specialties, universities
│
├── components/
│   ├── assessment/assessment-content.tsx   # 5-step assessment UI
│   ├── results/results-content.tsx         # Results display
│   ├── dashboard/dashboard-content.tsx
│   ├── explorer/explorer-content.tsx
│   ├── admin/admin-dashboard.tsx
│   └── ui/                                 # shadcn/ui primitives
│
├── lib/
│   ├── scoring.ts          # ★ MESRS Moyenne Pondérée engine + eligibility
│   ├── profile-fit.ts      # ★ Rule-based fit scorer (interests/strengths/etc.)
│   ├── auth.ts             # NextAuth config (Credentials provider, JWT)
│   ├── auth-client.ts      # Client-side signIn/signOut/signUp helpers
│   ├── db/
│   │   ├── index.ts        # Drizzle + node-postgres pool
│   │   └── schema.ts       # All table definitions
│   └── data/
│       ├── offerings.json      # 4,719 official MESRS offerings (P1/P2/P3 thresholds)
│       ├── specialties.json    # Specialty catalogue
│       └── universities.json   # University catalogue
│
├── drizzle/                # SQL migrations
├── scripts/seed-official.ts
├── ai-service/             # ⚠️ Unused legacy scaffold (Python/scikit-learn)
│   ├── main.py
│   └── requirements.txt
└── public/                 # Static assets & SVG icons
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **PostgreSQL** database
- **Groq API key** (free tier works) — [console.groq.com](https://console.groq.com)
- **Resend API key** — [resend.com](https://resend.com) (for email verification)

### 1. Clone & install

```bash
git clone https://github.com/your-username/masarek.git
cd masarek
pnpm install
```

### 2. Environment variables

Create a `.env.local` file at the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/masarek"

# NextAuth — generate a secret: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# App URL (used in verification emails)
APP_URL="http://localhost:3000"

# Groq — required for AI ranking (free tier available)
GROQ_API_KEY="gsk_..."

# Resend — required for email verification
RESEND_API_KEY="re_..."
EMAIL_FROM="Masarek <onboarding@resend.dev>"
```

> Without `GROQ_API_KEY`, the assessment still works — it falls back to deterministic templated Arabic reasons. Without `RESEND_API_KEY`, registration skips the email step (a warning is logged).

### 3. Database setup

```bash
# Push the schema to your database
pnpm drizzle-kit push

# (Optional) Seed with official MESRS data
pnpm tsx scripts/seed-official.ts
```

### 4. Run

```bash
pnpm dev
```

App available at [http://localhost:3000](http://localhost:3000). No other service needs to be running.

---

## 🤖 Assessment Pipeline (Deep Dive)

### Step 1 — Eligibility filter (`lib/scoring.ts`)

Implements the official MESRS formula:

```
MP = (MoyenneGénérale + (Σ coef_i × note_i) / Σ coef_i) / 2
```

Subject coefficients vary by BAC stream (`BacSeries`) × domain (`DomainKey`). For example, `sciences_experimentales:P` (Medicine) weights Biology×5, Maths×4, Physics×4. If subject notes are not provided, the formula falls back to the plain `MoyenneGénérale`.

The function `rankAdmissibleOfferings()` scans all 4,719 offerings, checks each against 3 priority thresholds, and returns the top 25 eligible options sorted by admission priority then safety margin.

### Step 2 — Profile fit scorer (`lib/profile-fit.ts`)

A fully deterministic scorer that assigns 0–100 points per offering:

| Component | Max pts | Logic |
|---|---|---|
| Interest fit | 30 | Counts how many of the student's interests map to this domain |
| Strength fit | 25 | Weighted dot-product of student skill levels vs domain requirements |
| Work environment | 8 | Boolean match: student's preferred env ↔ domain |
| Career priorities | 12 | Top-3 priorities weighted 6/4/2 |
| Margin bonus | 5 | Reward for comfortable admission (score − threshold) |
| Overqualification penalty | −12/−8 | Penalises trivial options for strong students with no matching interest |

### Step 3 — Groq re-ranking

The short-list (≤ 25 admissible, scored) is sent to `llama-3.3-70b-versatile` with a strict JSON schema. The LLM writes one Arabic and one French justification sentence per result. It **cannot invent new options** — it only re-ranks and explains what the deterministic engine already validated. On failure, the deterministic reasons from `buildReasons()` are used instead.

---

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `user` | Auth users |
| `session` / `account` / `verification` | NextAuth JWT session management |
| `student_profiles` | BAC data, interests, XP, assessment state, 24h rate-limit counter |
| `universities` | Algerian universities with MESRS codes |
| `specializations` | Academic specialties with codes, domains, durations |
| `offerings` | University × specialty pairs with P1/P2/P3 thresholds (4,719 rows) |
| `recommendations` | Persisted AI results per student |
| `saved_specializations` | Student bookmarks |
| `assessment_responses` | Individual question answers |

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js in development mode |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm drizzle-kit generate` | Generate a new migration from schema changes |
| `pnpm drizzle-kit push` | Push schema directly to the database |
| `pnpm tsx scripts/seed-official.ts` | Seed official MESRS university & specialty data |

---

## 🔑 Required Environment Variables (Summary)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `NEXTAUTH_URL` / `APP_URL` | ✅ | Base URL (used in emails) |
| `GROQ_API_KEY` | ⚠️ Recommended | LLM ranking — falls back to deterministic if absent |
| `RESEND_API_KEY` | ⚠️ Recommended | Email verification — skipped if absent |
| `EMAIL_FROM` | Optional | Sender address for Resend emails |

---

## 🌍 Deployment

The project is a standard Next.js app with no sidecar service required.

**Vercel (recommended):**

1. Push to GitHub and import into Vercel.
2. Add all environment variables in the Vercel dashboard.
3. Vercel will build and deploy automatically.

**Database:** Any managed PostgreSQL works — Neon, Supabase, Railway, or self-hosted.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

Private — all rights reserved © Masarek.
