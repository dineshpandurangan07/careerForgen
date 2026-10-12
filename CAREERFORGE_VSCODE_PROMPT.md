# CareerForge AI — Build Prompt for VS Code

Paste everything below the line into Claude Code, GitHub Copilot Chat (Agent mode), Cursor, or any coding assistant that can edit files in your VS Code workspace. Put `careerforge-student.html` and `assets/girl.webp` in the workspace first. They are the visual and behavioural reference.

---

## 0. Your role

You are a senior full-stack engineer and UI engineer. Build **CareerForge AI**, a career-readiness platform for college students (mainly India), as a real, working, production-oriented app. Do not build a mockup. Every button, form, filter, navigation item, and API must work against real data.

`careerforge-student.html` in this workspace is a working single-file prototype of the student experience. Treat it as the **source of truth for design, copy, flows, and scoring formulas**. Port its logic into proper modules and services. Do not copy the file as-is. `assets/girl.webp` is the transparent character image used on the login page.

Work in phases (section 12). After each phase, run it, test it, and tell me what works before moving on. Never leave TODO placeholders for core features.

## 1. What the product does

A student signs in, connects GitHub, LeetCode and LinkedIn, chooses a target role, and gets: a readiness score with a level (Beginner / Average / Advanced), a skill-gap view, a step-by-step roadmap, a personal written guide, profile reviews, job matches with explanations, job-market analysis, and an AI career coach they can ask anything. Recruiters, placement officers, and admins use a separate portal.

Be honest everywhere. Scores are estimates. Never promise jobs or salaries. Say so in the UI.

## 2. Tech stack

- **Student app:** React + Vite + TypeScript, React Router, Tailwind CSS, React Hook Form + Zod, Axios, Recharts, Framer Motion (sparingly).
- **Recruiter / placement / admin app:** Angular (latest) with Angular Material, Reactive Forms, RxJS.
- **API service (Express.js):** auth, users, profiles, connected accounts, jobs, applications, companies, uploads, notifications.
- **AI / analytics service (NestJS):** career analysis, skill gap, roadmap, job matching, profile review, coach chat, guide generation, analytics.
- **Database:** MongoDB (Atlas) with Mongoose. Both services share it.
- **Monorepo:** `apps/student-react`, `apps/admin-angular`, `apps/express-api`, `apps/nest-ai-service`, `packages/shared-types`, `docs/`, `docker-compose.yml`, `.env.example`, `README.md`.
- Express owns auth, CRUD and files. NestJS owns AI, scoring, matching and analytics. Do not duplicate business logic between them. The scoring and matching code lives in NestJS only, and Express calls it.

## 3. Design system (match the prototype exactly)

**Look:** soft 3D "clay" style, lavender and purple, rounded and friendly.

- **Tokens (light):** bg `#EEE8FB`, surface `#FFFFFF`, ink `#2B2350`, muted `#6B6690`, line `#E3DCF6`, soft `#F2EDFD`, brand purple `#7B5CF0`, gradient buttons `#9B86FF → #7457EE` with a darker bottom edge `#5B3FD4`, gold `#FFC857`, ok `#1E8E5A`, warn `#B7791F`, bad `#C0392B`.
- **Tokens (dark):** bg `#171230`, surface `#221B45`, ink `#EEEAFF`, muted `#A9A2D0`, line `#352D61`, soft `#2C2455`. Follow `prefers-color-scheme`.
- **Fonts:** Fredoka (headings, big numbers) and Nunito (body), from Google Fonts, with system fallbacks.
- **Components:** cards radius 26px with layered purple shadows and an inner top highlight. Buttons are pressable: a solid bottom edge that shrinks on `:active`. Inputs are inset and soft with no border. Chips are tinted pills. Active navigation is a purple gradient pill.
- **Readiness colour (the signature idea):** any score maps to a heat colour from blue (hue 212) through green to orange (hue 20): `hsl(212 - score*192, 72%, 46%)`. Use it on the gauge, bars and percentages.
- **Accessibility:** visible focus ring (3px purple), labels on every input, `aria-live` for toasts and chat, `aria-pressed` on toggles, `prefers-reduced-motion` respected, contrast at least 4.5:1.
- **Responsive:** laptop gets a floating white sidebar (230px). Phone gets a top bar, a floating bottom tab bar (Home, Coach, Roadmap, Jobs, More) and a "More" bottom sheet with the other pages. Tablet narrows the sidebar. Never allow sideways scrolling. Inputs are 16px on mobile. Touch targets at least 44px.

## 4. Login page (3D scene)

Recreate the prototype's login scene:

- Lavender gradient background, round podium, two clouds, a swaying hanging lamp, a shelf with books and a pink plushie, two potted plants.
- The girl from `assets/girl.webp` stands left of the card with her hand on the card's edge. Position her with a CSS variable width: `left: calc(50% - 190px - var(--w) * .8)`.
- A white 3D card (380px wide, radius 44px) with a purple graduation-cap tile (gold star) overlapping the top edge, "Welcome Back!", email field with icon, password field with an eye toggle, "Forgot Password?", a big 3D **Login** button, "or continue with", a **Continue with Google** button, and "Don't have an account? Sign Up".
- Same card for **Sign Up** (name, email, password, confirm), **Forgot password**, and the Google step.
- Parallax: scene elements shift slightly with the pointer, and the girl, tile and clouds float gently. Disable on touch and with reduced motion. Keep the card itself still so clicks always land.
- Phone: the girl becomes a cropped bust peeking over the card's top-left corner, with a bottom fade.

**Auth (real, server-side):** register, login, logout, JWT access token (15 min) plus refresh token (httpOnly cookie, rotation), bcrypt hashing, email verification, forgot/reset password, rate limiting and lockout (5 failures → 30 s), generic login errors, Zod validation on both sides. Password: at least 8 characters with a letter and a number.

**Continue with Google:** implement real Google OAuth 2.0 / OpenID Connect through the Express API (`/api/auth/google`, `/api/auth/google/callback`) with Google client ID and secret from env. Link by verified email. If the email already has a password account, require the password login or an explicit link step. Never let a Google sign-in silently take over a password account.

## 5. Student journey (exact order)

1. **Login / Sign up.**
2. **Connect your profiles** (shown right after every login until at least one profile is linked; includes "Skip for now").
   - GitHub: profile link or username. Parse `https://github.com/name` to `name`. Validate (letters, numbers, single hyphens, max 39).
   - LeetCode: profile link or username. Parse `leetcode.com/u/name`. Validate 3–30 of letters, numbers, `_`, `-`.
   - LinkedIn: profile URL (validate `linkedin.com/in/...`) plus a checklist the student ticks: photo, headline names target role, About written, projects listed, at least 10 skills.
   - Email is the login email (editable contact email).
   - **Real data:** GitHub public REST API (repos, stars, languages, recent commit activity via events). LeetCode public stats (easy/medium/hard, streak). Cache results and respect rate limits and each site's terms. LinkedIn has no open profile API, so use the checklist plus optional "Sign in with LinkedIn" (OpenID) for name and photo only. Never scrape LinkedIn. Until sync works, allow manual numbers exactly like the prototype.
3. **Profile review** and **Target role** (see 6.3).
4. **Career guidance** with the personal guide.
5. Then Overview, Skill gap, Roadmap, Career coach, Jobs, Job analysis, Profile and scoring.

New accounts start blank (all skills at zero, Beginner). Show a **"Get set up"** checklist on Overview (target role, skill levels, marks, a project, connect profiles) and an optional **sample profile** button for demos.

## 6. Features and exact logic

### 6.1 Readiness engine
Eight categories, each 0–1, with configurable weights (default: Technical 25, Projects 15, Academics 10, Coding 15, Resume 10, Certifications 5, Interview 10, Soft skills 10; normalised so they always sum to 100%). Admin sets defaults. The student can adjust on Profile.
- Technical = mean over target-role skills of `min(level / required, 1)`.
- Projects = `0.5 * (projects touching role skills / 3) + 0.5 * (distinct role skills covered / max(4, 0.6 * skills))`; if GitHub is linked: `0.75 * that + 0.25 * min(repos / 8, 1)`.
- Academics = `CGPA / 10`. Coding = `(easy + 2*medium + 4*hard) / 450`, or `solved / 300` without LeetCode. Resume, Interview, Soft = score / 100. Certifications = `min(count / 4, 1)`.
- **Levels:** under 40% Beginner, 40–69% Average, 70% and above Advanced. Show a level for the overall score, every category, and every skill (0 Not started, 1–2 Beginner, 3 Average, 4–5 Advanced).

### 6.2 Skill gap and roadmap
- Skill levels 0–5, set by clicking boxes. A marker shows the level the role needs. Status: Ready, In progress, Missing.
- Roadmap = skills with a gap, in learning order. Priority: gap ≥ 3 High, 2 Medium, 1 Low. Duration `max(1, round(gap * 1.5))` weeks. Each step has a practice task and a project task. Use specific tasks per skill from a seeded `learningTasks` collection, with a generic fallback.
- Marking a step done raises that skill to its target level and recalculates readiness. Undo restores the previous level.

### 6.3 Target role
- Catalog of at least 10 roles (Full Stack, Frontend, Backend, Data Analyst, ML Engineer, DevOps, Cybersecurity, UI/UX, QA, Mobile), each with `about`, `aliases`, and ordered `[skill, requiredLevel]` pairs. Admin can edit the catalog.
- The student types any role. Show matching catalog roles. If none fit, **"Build a plan for this role"** calls the NestJS AI service to return `{name, about, reqs:[[skill, level 1-5]...]}` with 6–12 skills in learning order, tuned for an entry-level job in India. If AI is unavailable, offer a manual skills list.
- **Sanitise all AI and user text:** allow only letters, digits, spaces and `. + # / ( ) -`; reject `__proto__`/`constructor`-style names; clamp levels 1–5; dedupe. Store as the student's custom role. Always escape output.
- The header has a role dropdown with "Choose another role…".

### 6.4 Profile review
Per platform, a score, a level, "What's working" and "Fix next" lists:
- **GitHub:** `0.4*min(repos/8,1) + 0.35*min(commits90/60,1) + 0.1*min(stars/10,1) + 0.15*min(languages/3,1)`.
- **LeetCode:** `0.8*codingScore + 0.2*min(streak/14,1)`.
- **LinkedIn:** ticked checks / 5.
- Overall profile strength is the average of linked platforms. Tailor advice to the target role. An "Ask the coach to review them" button opens the coach with this context.

### 6.5 Career guidance
- **Your guide for [role]:** headings What this role is, Where you stand today, Your first week, Step-by-step path (6–8 steps with time estimates), Projects to build, Practice and interview preparation, Mistakes to avoid. Generated by the AI service from the student's real data, stored per role, and marked stale when the level changes or the score moves by 10 points or more ("Update my guide"). Stream the response. Provide a deterministic built-in version from roadmap data when AI is unavailable.
- Also show: About this role, closest career paths (skills fit + demand), a 12-week plan matched to level, and a "what to do first" list driven by connected-account data.

### 6.6 Career coach (chat)
A ChatGPT-style chat. The server builds context from the student's profile (target role, scores, levels, gaps, projects, GitHub, LeetCode, LinkedIn, applications) and a safety-minded system prompt: beginner-friendly "start here" path first, short practical answers, honest about uncertainty, no promises, reply in the student's language (English, Tamil, Hindi…), stay on careers and learning, be kind about placement stress. Stream tokens. Keep the last 40 messages per student. Starter chips change with level. "Ask coach" buttons on roadmap steps, jobs, and guidance prefill a question. The AI API key stays on the server only.

### 6.7 Jobs, matching, analysis
- Match = `0.5*skill + 0.2*project + 0.15*education + 0.15*preference`. Skill = mean of `min(level/3,1)` over required skills (`0.85` weight) plus preferred skills (`0.15`). Project = share of required skills appearing in the student's projects. Education = 1 if CGPA ≥ minimum, otherwise a linear penalty. Preference = work mode and city fit. Show the four parts, matched and missing skills, and a plain "why". Label it a **fit estimate**, never a hiring prediction.
- Search, filters (role, location, work mode, salary, company, skills), sort by deadline, save, apply, withdraw. Server-side pagination.
- **Job analysis:** counts of Within reach (70%+), Close (50–69%), Stretch (<50%); most requested skills across real postings with the student's level beside each; openings closest to the target role; fit by role; one insight sentence naming the skill that would unlock the most roles.

### 6.8 Recruiter, placement officer, admin (Angular)
Follow RBAC: STUDENT, RECRUITER, PLACEMENT_OFFICER, ADMIN.
- **Recruiter:** company profile, job CRUD (draft/published/closed/archived), eligibility, applicant table with search/filter/sort/pagination, resume preview, shortlist/reject, schedule interview, status updates with history and student notification.
- **Placement officer:** dashboard (students, placement-ready, applications, interviews, offers, companies, active jobs), department readiness, skill gaps, most demanded skills, placement drives, training needs, report export (PDF and CSV).
- **Admin:** users and roles, skills, career roles, courses, scoring weights, system settings, audit logs, full analytics.
- Application states: APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW, SELECTED, REJECTED, WITHDRAWN. Every change stores history, notifies the student, and writes an audit entry.

## 7. Data model (Mongoose, with indexes and validation)

`users, students, recruiters, placementOfficers, companies, jobs, applications, skills, studentSkills, projects, certifications, resumes, careerProfiles, careerGoals (targetRole, customRole), careerRoadmaps, skillGaps, guides (studentId, roleKey, markdown, level, pct, createdAt), connectedAccounts (github, leetcode, linkedin, checks, lastSyncAt), profileReviews, courses, learningProgress, codingProgress, interviews, interviewResults, coachMessages, notifications, auditLogs, settings`.
Index email (unique), role, job title, skills, company, application status, deadlines, targetRole. Paginate every list.

## 8. API conventions

REST under `/api`. Consistent responses: `{ success, data }` and `{ success:false, message, errorCode }`. Central error handler, no stack traces in production, correct status codes. Examples: `POST /api/auth/register|login|refresh|logout|google`, `GET/PUT /api/students/profile`, `PUT /api/students/connections`, `POST /api/ai/target-role`, `POST /api/ai/guide`, `POST /api/ai/coach` (streaming), `POST /api/ai/profile-review`, `POST /api/ai/job-match`, `GET /api/jobs`, `POST /api/jobs/:id/apply`, `PUT /api/applications/:id/status`, `GET /api/analytics/skills|placement`.

## 9. Security

bcrypt, JWT with refresh rotation, RBAC on every route, Zod/Joi validation everywhere, rate limiting, helmet, strict CORS, input sanitisation, escape all rendered text (no raw `innerHTML` with user or AI text), file type and size checks, resumes and photos in object storage (store URL, type, size, owner, timestamp), audit logs, secrets only in env. Never expose the AI key, JWT secrets or DB credentials to the browser.

## 10. Environment (`.env.example`)

`NODE_ENV, PORT, CLIENT_URL, MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, AI_API_KEY, GITHUB_TOKEN (optional, raises rate limits), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, SMTP_HOST, SMTP_USER, SMTP_PASS, FILE_STORAGE_URL, FILE_STORAGE_KEY`.

## 11. Seed data and tests

- Seed realistic Indian-market demo data (students, companies, jobs with real skill lists, courses, role catalog, learning tasks) and label it clearly as demo data.
- Tests: auth and lockout, RBAC, job apply and status history, scoring formulas (unit tests with fixed inputs matching section 6), role-name sanitisation, AI service validation, and Playwright end-to-end flows: Student (register → connect → target → guidance → apply), Recruiter (create job → shortlist → schedule), Admin (analytics → users → audit logs). Test at 390px and 1366px widths with no horizontal overflow.

## 12. Build order

1. Monorepo, Docker Compose, Express + NestJS + MongoDB wiring, shared types.
2. Auth, RBAC, Google OAuth, email verification, audit logs.
3. React app shell, design system, the 3D login scene, responsive navigation.
4. Connected accounts (GitHub and LeetCode sync, LinkedIn checklist), Profile review.
5. Target role (catalog, AI-built roles, sanitising), skill gap, roadmap, readiness engine.
6. Career guidance and personal guide, coach chat with streaming.
7. Jobs, matching, applications, job analysis.
8. Angular portals: recruiter, placement officer, admin, reports.
9. Notifications (real-time with Socket.IO), tests, security hardening, performance.
10. Docs (README with architecture, setup, API, roles, screenshots), deployment config.

## 13. Rules

No dead buttons. No hard-coded dashboard numbers. No secrets in code. No TODOs for core features. Reusable components. Loading, empty and error states everywhere. Validate on client and server. Keep services modular. Be honest in the UI about estimates and demo data. After each phase, run the app and the tests and report what works and what does not.
