/**
 * @careerforge/shared
 * Domain types, constants and the readiness / matching engine.
 * Ported from the CareerForge student prototype so the client and server
 * compute exactly the same numbers.
 */

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type CategoryKey =
  | "tech"
  | "projects"
  | "academics"
  | "coding"
  | "resume"
  | "certs"
  | "interview"
  | "soft";

export type Weights = Record<CategoryKey, number>;

export interface Role {
  key: string;
  name: string;
  alias?: string;
  about?: string;
  /** ordered [skill, required level 1-5] pairs, foundations first */
  reqs: [string, number][];
  custom?: boolean;
}

export interface Prof {
  cgpa: number;
  solved: number;
  certs: number;
  resume: number;
  interview: number;
  soft: number;
  pref: WorkMode;
  city: string;
}

export type WorkMode = "Remote" | "Hybrid" | "On-site";

export interface GithubConn {
  user: string;
  linked: boolean;
  repos: number;
  stars: number;
  commits: number;
  langs: string;
}

export interface LeetConn {
  user: string;
  linked: boolean;
  easy: number;
  medium: number;
  hard: number;
  streak: number;
}

export interface LinkedinConn {
  url: string;
  linked: boolean;
  checks: Record<string, boolean>;
}

export interface Connect {
  done: boolean;
  email: string;
  gh: GithubConn;
  lc: LeetConn;
  li: LinkedinConn;
}

export interface Project {
  name: string;
  tech: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type LevelName = "Beginner" | "Average" | "Advanced";

export interface CoachGuide {
  text: string;
  level: LevelName;
  pct: number;
  at: number;
}

export interface DoneFlags {
  /** previous level before the step was marked done */
  prev: number;
  req: number;
}

export interface StudentState {
  role: string;
  targetSet: boolean;
  customRoles: Record<string, Role>;
  guides: Record<string, CoachGuide>;
  levels: Record<string, number>;
  projects: Project[];
  prof: Prof;
  weights: Weights;
  /** roleKey -> skill -> done flag */
  done: Record<string, Record<string, DoneFlags>>;
  saved: (number | string)[];
  applied: Record<string, string>;
  chat: ChatMessage[];
  connect: Connect;
}

export interface Job {
  id: number | string;
  title: string;
  co: string;
  loc: string;
  mode: WorkMode;
  lpa: string;
  min: number;
  req: string[];
  pref: string[];
}

export interface MatchResult {
  total: number;
  skill: number;
  proj: number;
  edu: number;
  pref: number;
  matched: string[];
  missing: string[];
}

export interface Gap {
  skill: string;
  req: number;
  cur: number;
  gap: number;
  order: number;
}

export interface RoadmapStep {
  skill: string;
  req: number;
  cur: number;
  gap: number;
  done: boolean;
  weeks: number;
  priority: "High" | "Medium" | "Low";
  task: [string, string];
}

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const R = (key: string, role: Omit<Role, "key">): Role => ({ key, ...role });

export const ROLES: Record<string, Role> = {
  fullstack: R("fullstack", {
    name: "MERN Full Stack Developer",
    alias:
      "full stack web developer software engineer sde mern mean react node",
    about:
      "Builds both the screens users see and the server and database behind them, usually with React, Node.js and MongoDB.",
    reqs: [
      ["HTML", 3], ["CSS", 3], ["JavaScript", 4], ["Git", 3], ["React", 4],
      ["Node.js", 3], ["Express.js", 3], ["MongoDB", 3], ["REST APIs", 3], ["Authentication", 3], ["Docker", 2],
    ],
  }),
  frontend: R("frontend", {
    name: "Frontend Developer",
    alias: "front end web ui react angular vue developer",
    about:
      "Turns designs into fast, accessible web pages and apps that people use in the browser.",
    reqs: [
      ["HTML", 3], ["CSS", 4], ["JavaScript", 4], ["Git", 3], ["React", 4],
      ["Responsive Design", 3], ["REST APIs", 2], ["Accessibility", 2], ["Testing", 2],
    ],
  }),
  backend: R("backend", {
    name: "Backend Engineer (Java)",
    alias: "java spring api server backend developer",
    about:
      "Builds the services, databases and APIs that power applications behind the scenes.",
    reqs: [
      ["Git", 3], ["Java", 4], ["SQL", 4], ["REST APIs", 4], ["Spring Boot", 3],
      ["Authentication", 3], ["Docker", 3], ["System Design", 2],
    ],
  }),
  data: R("data", {
    name: "Data Analyst",
    alias: "analytics business intelligence bi power bi reporting excel sql",
    about:
      "Collects and cleans data, finds patterns, and explains them through charts and reports so teams can decide.",
    reqs: [
      ["Excel", 3], ["SQL", 4], ["Python", 4], ["Statistics", 3], ["Pandas", 3],
      ["Data Visualization", 3], ["Machine Learning", 2],
    ],
  }),
  ml: R("ml", {
    name: "Machine Learning Engineer",
    alias:
      "machine learning ai data scientist deep learning artificial intelligence ml",
    about:
      "Trains and deploys models that learn from data, such as recommendations, predictions or language tools.",
    reqs: [
      ["Python", 4], ["Statistics", 3], ["SQL", 3], ["Pandas", 3], ["Git", 3],
      ["Machine Learning", 4], ["Deep Learning", 2],
    ],
  }),
  devops: R("devops", {
    name: "DevOps Engineer",
    alias:
      "sre cloud aws azure infrastructure site reliability platform",
    about:
      "Automates how software is built, tested, deployed and monitored so releases are fast and reliable.",
    reqs: [
      ["Linux", 3], ["Git", 3], ["Scripting", 3], ["Networking", 2], ["Docker", 4],
      ["CI/CD", 3], ["Cloud (AWS)", 3], ["Kubernetes", 2],
    ],
  }),
  cyber: R("cyber", {
    name: "Cybersecurity Analyst",
    alias:
      "security ethical hacking soc infosec cyber penetration tester",
    about:
      "Protects systems and data by watching for threats, finding weaknesses and responding to incidents.",
    reqs: [
      ["Networking", 3], ["Linux", 3], ["Security Fundamentals", 4], ["Scripting", 3],
      ["Incident Response", 2], ["Cryptography", 2],
    ],
  }),
  uiux: R("uiux", {
    name: "UI/UX Designer",
    alias: "ux ui designer product design figma user experience interface",
    about:
      "Researches what users need and designs clear, usable screens and flows for apps and websites.",
    reqs: [
      ["Design Fundamentals", 4], ["Figma", 4], ["User Research", 3], ["Prototyping", 3],
      ["Accessibility", 2], ["HTML", 2], ["CSS", 2],
    ],
  }),
  qa: R("qa", {
    name: "QA / Test Engineer",
    alias: "tester testing quality assurance automation sdet selenium",
    about:
      "Finds bugs before users do by planning tests, automating them and checking that software works as promised.",
    reqs: [
      ["Testing", 4], ["Bug Reporting", 3], ["SQL", 2], ["Git", 3], ["REST APIs", 3],
      ["JavaScript", 2], ["Test Automation", 3],
    ],
  }),
  mobile: R("mobile", {
    name: "Mobile App Developer",
    alias: "android ios flutter kotlin app developer react native",
    about:
      "Builds apps for phones, from screens and offline storage to talking with servers.",
    reqs: [
      ["Git", 3], ["Kotlin", 3], ["Android", 4], ["UI Design", 2], ["REST APIs", 3], ["SQL", 2],
    ],
  }),
};

export const TASKS: Record<string, [string, string]> = {
  "Express.js": [
    "Build a CRUD API with routes, middleware and error handling",
    "Add an Express backend to your Campus Marketplace project",
  ],
  "REST APIs": [
    "Design 6 endpoints with correct status codes and pagination",
    "Publish API docs with example requests for your project",
  ],
  Authentication: [
    "Implement register/login with bcrypt and JWT refresh tokens",
    "Protect two routes of your project with role-based access",
  ],
  Docker: [
    "Containerise a Node app with a Dockerfile",
    "Run app + database together with docker-compose",
  ],
  "Node.js": [
    "Read/write files and build a small CLI with async/await",
    "Move business logic of a project into a Node service",
  ],
  React: [
    "Build a form-heavy page with hooks and controlled inputs",
    "Add routing and API data fetching to a project",
  ],
  SQL: [
    "Solve 25 JOIN/GROUP BY problems",
    "Design a normalised schema for a small project",
  ],
  Python: [
    "Solve 30 problems using lists, dicts and functions",
    "Write a script that cleans and summarises a CSV",
  ],
};

export const CATS: [CategoryKey, string][] = [
  ["tech", "Technical skills"],
  ["projects", "Projects"],
  ["academics", "Academics"],
  ["coding", "Coding / DSA"],
  ["resume", "Resume"],
  ["certs", "Certifications"],
  ["interview", "Interview prep"],
  ["soft", "Soft skills"],
];

export const DEFAULT_WEIGHTS: Weights = {
  tech: 25, projects: 15, academics: 10, coding: 15,
  resume: 10, certs: 5, interview: 10, soft: 10,
};

export const LI_CHECKS: [string, string][] = [
  ["photo", "Profile photo added"],
  ["headline", "Headline names your target role"],
  ["about", "About section written"],
  ["projects", "Projects listed"],
  ["skills", "At least 10 skills added"],
  ["experience", "Internship or experience listed"],
  ["certs", "Certifications added"],
  ["recs", "Has a recommendation or endorsement"],
];

export const CAT_ACT: Record<CategoryKey, string> = {
  tech: "Close your biggest skill gap first (see Roadmap)",
  projects: "Ship one deployed project that uses the core stack of your target role",
  academics: "Clear backlogs and lift your next-semester marks; many companies filter on CGPA",
  coding: "Practise data-structure problems in weekly sets",
  resume: "Rewrite your resume with one measurable result per project",
  certs: "Earn one recognised certificate tied to your target role",
  interview: "Take a mock interview each week and review the concepts you missed",
  soft: "Practise explaining each project aloud in two minutes",
};

export const PLAN: Record<LevelName, [string, string][]> = {
  Beginner: [
    ["Weeks 1–4", "Learn the fundamentals of the top 3 skills on your roadmap and write code every day."],
    ["Weeks 5–8", "Build one small project from start to finish and put it on GitHub."],
    ["Weeks 9–12", "Solve 30 easy problems, write your first resume, and complete one mock interview."],
  ],
  Average: [
    ["Weeks 1–4", "Close your High-priority gaps and build a project with login and a database."],
    ["Weeks 5–8", "Deploy that project, write a clear README, and solve 2 medium problems a week."],
    ["Weeks 9–12", "Tailor your resume per job, complete 3 mock interviews, and apply to 3 roles a week."],
  ],
  Advanced: [
    ["Weeks 1–4", "Choose a specialisation and study system-design basics."],
    ["Weeks 5–8", "Contribute to open source or build something real users touch, and attempt hard problems."],
    ["Weeks 9–12", "Target roles slightly above your comfort level, ask for referrals, and rehearse design rounds."],
  ],
};

export const DEMO_LEVELS: Record<string, number> = {
  HTML: 4, CSS: 3, JavaScript: 4, Git: 3, React: 3, "Node.js": 2,
  "Express.js": 1, MongoDB: 3, "REST APIs": 1, Authentication: 0, Docker: 0,
  Python: 2, SQL: 3, Java: 2, Excel: 2, Statistics: 1, Pandas: 1,
  "Data Visualization": 1, "Machine Learning": 0, "Spring Boot": 0, "System Design": 0,
};

export const DEMO_PROF: Prof = {
  cgpa: 7.8, solved: 112, certs: 2, resume: 74,
  interview: 61, soft: 70, pref: "Hybrid", city: "Madurai",
};

export const DEMO_PROJECTS: Project[] = [
  { name: "Campus Marketplace", tech: ["React", "Node.js", "MongoDB", "JavaScript"] },
  { name: "Expense Tracker", tech: ["HTML", "CSS", "JavaScript"] },
  { name: "Attendance Analyzer", tech: ["Python", "SQL", "Excel"] },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export const clamp = (v: number): number => Math.max(0, Math.min(1, v));
export const pct = (v: number): number => Math.round(v * 100);
export const heat = (t: number): string =>
  `hsl(${Math.round(212 - clamp(t) * 192)} 72% 46%)`;

export const levelOf = (v: number): LevelName =>
  v < 0.4 ? "Beginner" : v < 0.7 ? "Average" : "Advanced";
export const levelCls = (v: number): "bad" | "warn" | "ok" =>
  v < 0.4 ? "bad" : v < 0.7 ? "warn" : "ok";

export const skillLevelName = (n: number): string =>
  n === 0 ? "Not started" : n <= 2 ? "Beginner" : n === 3 ? "Average" : "Advanced";
export const skillLevelCls = (n: number): "bad" | "warn" | "ok" =>
  n <= 2 ? "bad" : n === 3 ? "warn" : "ok";

export const normS = (x: string): string => x.toLowerCase().replace(/[^a-z0-9]/g, "");

export const SAFE_RE = /[^A-Za-z0-9 .+#/()-]/g;
export const BADNAMES = new Set([
  "constructor", "prototype", "__proto__", "tostring", "valueof", "hasownproperty",
]);

export function cleanName(t: unknown, n: number): string {
  return String(t == null ? "" : t)
    .replace(SAFE_RE, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, n);
}

export function allSkills(customRoles: Record<string, Role> = {}): string[] {
  const base = Object.values(ROLES).flatMap((r) => r.reqs.map((x) => x[0]));
  const custom = Object.values(customRoles).flatMap((r) => r.reqs.map((x) => x[0]));
  return [...new Set([...base, ...custom])];
}

export function canon(customRoles: Record<string, Role>, t: string): string {
  const list = allSkills(customRoles);
  const b = normS(t);
  return (
    list.find((k) => {
      const a = normS(k);
      return a === b || a === b + "js" || a + "js" === b || a === b + "s";
    }) || t
  );
}

export function parseGh(v: string): string {
  v = (v || "").trim();
  const m = v.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/?(?:\?.*)?$/i);
  return m ? m[1] : v.replace(/^@/, "");
}

export function parseLc(v: string): string {
  v = (v || "").trim();
  const m = v.match(/^(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?([A-Za-z0-9_-]+)\/?$/i);
  return m ? m[1] : v.replace(/^@/, "");
}

export function cleanRole(
  raw: { name?: unknown; about?: unknown; reqs?: unknown } | null | undefined,
  fallbackName: string,
  min: number,
): Role | null {
  const name = cleanName((raw && raw.name) || fallbackName, 60);
  const about = String((raw && raw.about) || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
  const seen = new Set<string>();
  const reqs: [string, number][] = [];
  const rawReqs = ((raw && raw.reqs) || []) as unknown[];
  for (const it of rawReqs) {
    const arr = Array.isArray(it) ? it : null;
    const obj = !arr && it && typeof it === "object" ? (it as Record<string, unknown>) : null;
    const skRaw = arr ? arr[0] : obj ? obj.skill : undefined;
    const lvRaw = arr ? arr[1] : obj ? obj.level : undefined;
    const sk = cleanName(skRaw, 40);
    const lv = Math.round(Number(lvRaw));
    if (!sk || BADNAMES.has(sk.toLowerCase()) || seen.has(sk.toLowerCase())) continue;
    seen.add(sk.toLowerCase());
    reqs.push([sk, Math.min(5, Math.max(1, lv || 3))]);
    if (reqs.length >= 12) break;
  }
  if (!name || reqs.length < min) return null;
  return { key: "custom", name, about, reqs, custom: true };
}

/* ------------------------------------------------------------------ */
/* Engine                                                             */
/* ------------------------------------------------------------------ */

export function allRoles(state: Pick<StudentState, "customRoles">): Record<string, Role> {
  return Object.assign({}, ROLES, state.customRoles || {});
}

export function roleOf(state: Pick<StudentState, "role" | "customRoles">): Role {
  return allRoles(state)[state.role] || ROLES.fullstack;
}

export const lvl = (state: Pick<StudentState, "levels">, s: string): number => {
  const v = state.levels[s];
  return Number.isFinite(v) ? v : 0;
};

export const lcTotal = (state: Pick<StudentState, "connect">): number => {
  const l = state.connect.lc;
  return (+l.easy || 0) + (+l.medium || 0) + (+l.hard || 0);
};

export function codingScore(state: Pick<StudentState, "connect" | "prof">): number {
  const l = state.connect.lc;
  if (l.linked) {
    return clamp(((+l.easy || 0) + 2 * (+l.medium || 0) + 4 * (+l.hard || 0)) / 450);
  }
  return clamp(state.prof.solved / 300);
}

export function catScores(state: StudentState): Record<CategoryKey, number> {
  const r = roleOf(state).reqs;
  const tech = r.reduce((a, [s, n]) => a + clamp(lvl(state, s) / n), 0) / r.length;
  const techSet = new Set(r.map((x) => x[0]));
  const hit = state.projects.filter((p) => p.tech.some((t) => techSet.has(t))).length;
  const covered = new Set(
    state.projects.flatMap((p) => p.tech).filter((t) => techSet.has(t)),
  ).size;
  let projects = clamp(0.5 * (hit / 3) + 0.5 * (covered / Math.max(4, techSet.size * 0.6)));
  if (state.connect.gh.linked) {
    projects = clamp(0.75 * projects + 0.25 * clamp((+state.connect.gh.repos || 0) / 8));
  }
  return {
    tech,
    projects,
    academics: clamp(state.prof.cgpa / 10),
    coding: codingScore(state),
    resume: clamp(state.prof.resume / 100),
    certs: clamp(state.prof.certs / 4),
    interview: clamp(state.prof.interview / 100),
    soft: clamp(state.prof.soft / 100),
  };
}

export function overall(state: StudentState): number {
  const c = catScores(state);
  const w = state.weights;
  const tot = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return CATS.reduce((a, [k]) => a + c[k] * w[k], 0) / tot;
}

export function gaps(state: StudentState): Gap[] {
  return roleOf(state).reqs.map(([s, n], i) => ({
    skill: s,
    req: n,
    cur: lvl(state, s),
    gap: Math.max(0, n - lvl(state, s)),
    order: i,
  }));
}

export function gapStatus(g: Gap): [string, "ok" | "warn" | "bad"] {
  return g.gap === 0 ? ["Ready", "ok"] : g.cur === 0 ? ["Missing", "bad"] : ["In progress", "warn"];
}

export function roadmap(state: StudentState): RoadmapStep[] {
  const base = gaps(state).filter(
    (g) => g.gap > 0 || (state.done[state.role] || {})[g.skill] !== undefined,
  );
  return base.map((g) => {
    const d = (state.done[state.role] || {})[g.skill];
    const cur = d !== undefined ? d.prev : g.cur;
    const gap = Math.max(0, g.req - cur);
    const task = TASKS[g.skill] || [
      `Complete a guided tutorial on ${g.skill}`,
      `Use ${g.skill} in one of your projects`,
    ];
    return {
      skill: g.skill,
      req: g.req,
      cur,
      gap,
      done: d !== undefined,
      weeks: Math.max(1, Math.round(gap * 1.5)),
      priority: (gap >= 3 ? "High" : gap === 2 ? "Medium" : "Low") as "High" | "Medium" | "Low",
      task,
    };
  });
}

export function match(state: StudentState, job: Job): MatchResult {
  const sk = job.req.reduce((a, s) => a + clamp(lvl(state, s) / 3), 0) / job.req.length;
  const prefBonus = job.pref.length
    ? job.pref.reduce((a, s) => a + clamp(lvl(state, s) / 2), 0) / job.pref.length
    : 1;
  const skill = clamp(0.85 * sk + 0.15 * prefBonus);
  const proj =
    job.req.filter((s) => state.projects.some((p) => p.tech.includes(s))).length / job.req.length;
  const edu = state.prof.cgpa >= job.min ? 1 : clamp(1 - (job.min - state.prof.cgpa) / 2);
  const pref =
    (job.mode === state.prof.pref ? 0.5 : job.mode === "Remote" ? 0.4 : 0.15) +
    (job.loc === state.prof.city || job.mode === "Remote" ? 0.5 : 0.1);
  const total = 0.5 * skill + 0.2 * proj + 0.15 * edu + 0.15 * pref;
  return {
    total,
    skill,
    proj,
    edu,
    pref: clamp(pref),
    matched: job.req.filter((s) => lvl(state, s) >= 3),
    missing: job.req.filter((s) => lvl(state, s) < 3),
  };
}

export function relatedJobs(state: StudentState, allJobs: Job[]): Job[] {
  const r = roleOf(state);
  const ns = new Set(r.reqs.map((x) => normS(x[0])));
  return allJobs.filter(
    (j) => j.req.filter((s) => ns.has(normS(s))).length / j.req.length >= 0.5,
  );
}

export interface CareerRankRow {
  key: string;
  name: string;
  fit: number;
  jobs: number;
  score: number;
  have: string[];
  lack: string[];
}

export function careerRank(state: StudentState, allJobs: Job[]): CareerRankRow[] {
  const rs = Object.entries(allRoles(state)).map(([k, r]) => ({
    k,
    r,
    jobs: relatedJobs(state, allJobs).length,
  }));
  const max = Math.max(1, ...rs.map((x) => x.jobs));
  return rs
    .map(({ k, r, jobs }) => {
      const fit = r.reqs.reduce((a, [s, n]) => a + clamp(lvl(state, s) / n), 0) / r.reqs.length;
      return {
        key: k,
        name: r.name,
        fit,
        jobs,
        score: 0.75 * fit + (0.25 * jobs) / max,
        have: r.reqs.filter(([s, n]) => lvl(state, s) >= n).map((x) => x[0]),
        lack: r.reqs
          .filter(([s, n]) => lvl(state, s) < n)
          .sort((a, b) => (b[1] - lvl(state, b[0])) - (a[1] - lvl(state, a[0])))
          .map((x) => x[0]),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface Action {
  t: string;
  why: string;
}

export function actions(state: StudentState): Action[] {
  const c = state.connect;
  const out: Action[] = [];
  const cs = catScores(state);
  const add = (t: string, why: string) => out.push({ t, why });
  if (!c.gh.linked) add("Connect your GitHub", "Recruiters check it early, and your repositories then count toward the Projects score.");
  else {
    if (c.gh.repos < 4) add("Publish at least 4 project repositories, each with a README", `You reported ${c.gh.repos} public repos.`);
    if (c.gh.commits < 30) add("Commit on at least 3 days a week", `You reported ${c.gh.commits} commits in the last 90 days.`);
  }
  if (!c.lc.linked) add("Connect your LeetCode", "Coding practice feeds your score and is a screening step at many companies.");
  else {
    if (c.lc.medium < 20) add("Solve 2 medium problems a week", `${c.lc.medium} medium problems solved so far.`);
    if (c.lc.hard === 0 && cs.coding > 0.4) add("Attempt one hard problem a week", "No hard problems yet, and advanced roles ask for them.");
    if (c.lc.streak < 5) add("Build a daily streak", "Twenty minutes every day beats one long weekend session.");
  }
  add(
    c.li.linked ? "Match your LinkedIn headline to your target role" : "Add your LinkedIn URL",
    "Recruiters search by role and skill keywords, so keep it consistent with your resume.",
  );
  const weak = CATS.map(([k, n]) => ({ k, n, v: cs[k] })).sort((a, b) => a.v - b.v).slice(0, 3);
  weak.forEach((w) => add(CAT_ACT[w.k], `${w.n} is at ${pct(w.v)}%.`));
  return out;
}

/* ------------------------------------------------------------------ */
/* Profile performance                                                */
/* ------------------------------------------------------------------ */

export interface Perf {
  name: string;
  score: number;
  tips: string[];
  facts: string;
}

export function perfGit(state: StudentState): Perf | null {
  const g = state.connect.gh;
  if (!g.linked) return null;
  const need = new Set(roleOf(state).reqs.map((x) => normS(x[0])));
  const langs = String(g.langs || "").split(",").map((x) => x.trim()).filter(Boolean);
  const rel = langs.filter((l) => need.has(normS(canon(state.customRoles, l)))).length;
  const score = clamp(
    0.35 * clamp(g.repos / 8) +
      0.35 * clamp(g.commits / 90) +
      0.15 * clamp(g.stars / 10) +
      0.15 * (langs.length ? clamp(rel / 2) : 0),
  );
  const tips: string[] = [];
  if (g.repos < 4) tips.push(`Publish ${4 - g.repos} more project repo${4 - g.repos > 1 ? "s" : ""}, each with a README and screenshots.`);
  if (g.commits < 30) tips.push("Commit on at least 3 days a week. Aim for 30 or more commits in 90 days.");
  if (!rel) tips.push(`Build a project in a skill your target role needs, such as ${roleOf(state).reqs.slice(0, 3).map((x) => x[0]).join(", ")}.`);
  if (g.stars < 3) tips.push("Share your best project with classmates and on LinkedIn to earn your first stars.");
  if (!tips.length) tips.push("Strong profile. Pin your best 3 repos and keep a README with a live link on each.");
  return { name: "GitHub", score, tips: tips.slice(0, 3), facts: `${g.repos} repos · ${g.commits} commits (90 days) · ${g.stars} stars` };
}

export function perfLeet(state: StudentState): Perf | null {
  const l = state.connect.lc;
  if (!l.linked) return null;
  const tips: string[] = [];
  if (l.medium < 20) tips.push(`Solve 2 medium problems a week. You have ${l.medium} so far.`);
  if (l.hard === 0) tips.push("Try one hard problem a week once mediums feel comfortable.");
  if (l.streak < 5) tips.push("Build a daily streak. Twenty minutes a day beats one long weekend.");
  if (!tips.length) tips.push("Great consistency. Practise explaining your approach aloud, as interviews ask for it.");
  return { name: "LeetCode", score: codingScore(state), tips: tips.slice(0, 3), facts: `${l.easy} easy · ${l.medium} medium · ${l.hard} hard · ${l.streak}-day streak` };
}

export function perfLinked(state: StudentState): Perf | null {
  const li = state.connect.li;
  if (!li.linked) return null;
  const ck = li.checks || {};
  const miss = LI_CHECKS.filter(([k]) => !ck[k]);
  const T: Record<string, string> = {
    photo: "Add a clear, friendly profile photo.",
    headline: `Change your headline to say ${roleOf(state).name} plus 2 key skills.`,
    about: "Write 3 to 4 lines in About on what you're learning and building.",
    projects: "List your best projects with links.",
    skills: "Add at least 10 skills that match your target role.",
    experience: "Add internships, volunteering or club work.",
    certs: "List the certificates you've earned.",
    recs: "Ask a teacher or teammate for a recommendation.",
  };
  const tips = miss.slice(0, 3).map(([k]) => T[k]);
  if (!tips.length) tips.push("Complete profile. Post about one project a month to stay visible to recruiters.");
  return { name: "LinkedIn", score: (LI_CHECKS.length - miss.length) / LI_CHECKS.length, tips, facts: `${LI_CHECKS.length - miss.length} of ${LI_CHECKS.length} profile checks done` };
}

/* ------------------------------------------------------------------ */
/* Factories                                                          */
/* ------------------------------------------------------------------ */

export function blank(email = ""): StudentState {
  return {
    role: "fullstack",
    targetSet: false,
    customRoles: {},
    guides: {},
    levels: {},
    projects: [],
    prof: { cgpa: 0, solved: 0, certs: 0, resume: 0, interview: 0, soft: 0, pref: "Hybrid", city: "" },
    weights: { ...DEFAULT_WEIGHTS },
    done: {},
    saved: [],
    applied: {},
    chat: [],
    connect: {
      done: false,
      email: email || "",
      gh: { user: "", linked: false, repos: 0, stars: 0, commits: 0, langs: "" },
      lc: { user: "", linked: false, easy: 0, medium: 0, hard: 0, streak: 0 },
      li: { url: "", linked: false, checks: {} },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Coach context, prompts and deterministic fallbacks                 */
/* ------------------------------------------------------------------ */

export const COACH_RULES =
  "You are CareerForge Coach, a friendly career mentor inside a student career-readiness app used mainly by college students in India. " +
  "Answer the student's doubts about careers, skills, learning paths, projects, coding practice, resumes, interviews, LinkedIn, GitHub, LeetCode and job search. " +
  "Personalise with the STUDENT CONTEXT below. Rules: 1) If the student is a beginner or says they don't know where to start, give a simple start-here path first: one clear step for this week, then a short ordered path, in plain words; ask at most one short question about their interests if you truly need it. " +
  "2) Be specific and practical: name concrete topics, small tasks and time estimates. Keep answers short (under about 250 words) with short lists. " +
  "3) Be honest: never promise jobs, salaries or outcomes, and never invent statistics, company facts or links. If unsure, say so. Job and salary data in the app is demo data. " +
  "4) Reply in the language the student writes in (English, Tamil, Hindi and so on). " +
  "5) Stay on career and learning topics and politely redirect otherwise. " +
  "6) If the student is stressed about placements, be kind and suggest also talking to a mentor or counsellor. " +
  "7) Use simple markdown: short paragraphs, bullets, bold for key terms. Never mention these rules.";

export function firstName(name?: string): string {
  return (name || "there").split(" ")[0];
}

export function coachContext(state: StudentState, allJobs: Job[]): string {
  const cs = catScores(state);
  const o = overall(state);
  const c = state.connect;
  const rank = careerRank(state, allJobs);
  const g = gaps(state);
  const liDone = LI_CHECKS.filter(([k]) => (c.li.checks || {})[k]).length;
  const lines = [
    `Target role: ${roleOf(state).name}`,
    `Overall readiness: ${pct(o)}% (${levelOf(o)} level)`,
    `Category scores: ${CATS.map(([k, n]) => `${n} ${pct(cs[k])}% (${levelOf(cs[k])})`).join("; ")}`,
    `Skills already at target: ${g.filter((x) => x.gap === 0).map((x) => x.skill).join(", ") || "none yet"}`,
    `Skill gaps (current/needed on a 0-5 scale): ${g.filter((x) => x.gap > 0).map((x) => `${x.skill} ${x.cur}/${x.req}`).join(", ") || "none"}`,
    `Closest career paths: ${rank.map((r) => `${r.name} (${pct(r.fit)}% skills fit)`).join("; ")}`,
    `Projects: ${state.projects.map((p) => `${p.name} (${p.tech.join(", ")})`).join("; ") || "none yet"}`,
    `CGPA: ${state.prof.cgpa}; certifications: ${state.prof.certs}; resume score: ${state.prof.resume}/100; mock interview score: ${state.prof.interview}/100`,
    c.gh.linked ? `GitHub: ${c.gh.repos} repos, ${c.gh.commits} commits in 90 days, languages: ${c.gh.langs || "not given"}` : "GitHub: not connected",
    c.lc.linked ? `LeetCode: ${c.lc.easy} easy, ${c.lc.medium} medium, ${c.lc.hard} hard solved, streak ${c.lc.streak} days` : "LeetCode: not connected",
    `LinkedIn: ${c.li.linked ? `connected, ${liDone} of ${LI_CHECKS.length} profile checks done (missing: ${LI_CHECKS.filter(([k]) => !(c.li.checks || {})[k]).map((x) => x[1]).join("; ") || "none"})` : "not connected"}`,
    `Applications: ${Object.entries(state.applied).filter(([, v]) => v !== "Withdrawn").map(([id]) => allJobs.find((j) => String(j.id) === id)?.title).filter(Boolean).join(", ") || "none yet"}`,
  ];
  return lines.join("\n");
}

export function localAnswer(state: StudentState, allJobs: Job[], q: string): string {
  const t = q.toLowerCase();
  const cs = catScores(state);
  const rank = careerRank(state, allJobs);
  const best = rank[0];
  const lack = best.lack.slice(0, 4).join(", ") || "advanced topics in your stack";
  if (/start|begin|scratch|fresher|no idea|dont know|don't know|zero/.test(t))
    return `**Start here**\n1. Pick one direction for now. **${best.name}** fits your current skills best.\n2. This week, spend 20 minutes a day on **${best.lack[0] || "your next topic"}**.\n3. Learn in this order: ${lack}.\n4. After each topic, build something tiny with it and put it on GitHub.\n5. Add 2 easy coding problems a week once you feel comfortable.\n\nYou can change direction later. Ask about any step and I'll break it down.`;
  if (/career|role|suit|which job|path/.test(t))
    return `Based on your skills today, your closest paths are:\n${rank.map((r) => `- **${r.name}**: ${pct(r.fit)}% skills fit`).join("\n")}\n\nOpen **Career guidance** to see the gaps behind each one.`;
  if (/dsa|leetcode|coding|problem|algorithm/.test(t))
    return `Your coding score is ${pct(cs.coding)}% (${levelOf(cs.coding)}). Start with arrays and strings, then hash maps, then recursion. Aim for 2 to 3 problems a week, and re-solve the ones you got wrong after a few days.`;
  if (/resume|cv/.test(t))
    return `Keep your resume to one page. For each project write what you built, the tools you used, and one measurable result. List skills that match the job you're applying to, and don't include anything you can't discuss in an interview.`;
  if (/project/.test(t))
    return `Build one project that uses the core stack of **${best.name}**, deploy it, and write a README with screenshots and setup steps. One finished project beats five half-done ones.`;
  if (/interview/.test(t))
    return `Your interview preparation is at ${pct(cs.interview)}%. Explain your projects aloud in two minutes, revise fundamentals of your top skills, and practise a few common questions each week.`;
  if (/score|readiness|level/.test(t))
    return `Your readiness is ${pct(overall(state))}% (${levelOf(overall(state))}). Weakest areas: ${CATS.map(([k, n]) => ({ n, v: cs[k] })).sort((a, b) => a.v - b.v).slice(0, 3).map((x) => `${x.n} ${pct(x.v)}%`).join(", ")}.`;
  return `I can answer these without the AI coach: where to start, which career fits, coding practice, resume, projects, interviews, and your score. Try one of those.`;
}

export function localGuide(state: StudentState): string {
  const r = roleOf(state);
  const rm = roadmap(state).filter((x) => !x.done);
  const L = levelOf(overall(state));
  const first = rm[0];
  const steps = rm.slice(0, 8).map((x, i) => `${i + 1}. ${x.skill}: ${x.task[0]} (about ${x.weeks} week${x.weeks > 1 ? "s" : ""})`);
  const projects = rm.slice(0, 3).map((x) => `- ${x.task[1]}`);
  return [
    "## What this role is",
    r.about || "A role you chose yourself. The skills below are the ones to build.",
    "## Where you stand today",
    `You are at the **${L}** level for this role, with ${pct(overall(state))}% readiness. ${rm.length ? `${rm.length} skill${rm.length > 1 ? "s" : ""} still need work.` : "You've reached the target level for every skill."}`,
    "## Your first week",
    first ? `Spend 20 to 30 minutes a day on **${first.skill}**. ${first.task[0]}.` : "Pick one project and get it deployed.",
    ...(steps.length ? ["## Step-by-step path", ...steps] : []),
    ...(projects.length ? ["## Projects to build", ...projects] : []),
    "## Practice and interview preparation",
    "Solve 2 to 3 coding problems a week, explain each project aloud in two minutes, and take a mock interview with the coach every week.",
    "## Mistakes to avoid",
    "- Collecting tutorials without building anything.\n- Starting several skills at once.\n- Applying widely before you have one finished project.",
  ].join("\n");
}
