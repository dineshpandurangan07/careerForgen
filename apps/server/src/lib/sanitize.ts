import {
  CATS,
  LI_CHECKS,
  blank,
  cleanName,
  cleanRole,
  type CategoryKey,
  type Role,
  type StudentState,
  type Weights,
  type WorkMode,
} from "@careerforge/shared";

type Raw = Record<string, unknown>;

const num = (v: unknown, min: number, max: number, def = 0): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
};

const str = (v: unknown, max: number): string => cleanName(v, max);

const MODES: WorkMode[] = ["Remote", "Hybrid", "On-site"];

/** Validates and normalises an arbitrary object into a safe StudentState. */
export function sanitizeState(input: unknown, email: string): StudentState {
  const raw = (input && typeof input === "object" ? input : {}) as Raw;
  const s = blank(email);

  s.role = str(raw.role, 40) || "fullstack";
  s.targetSet = !!raw.targetSet;

  // custom roles
  const cr = (raw.customRoles && typeof raw.customRoles === "object" ? raw.customRoles : {}) as Raw;
  const customRoles: Record<string, Role> = {};
  for (const [k, v] of Object.entries(cr).slice(0, 20)) {
    const key = str(k, 40);
    const role = cleanRole(v as Raw, "", 3);
    if (key && role) customRoles[key] = role;
  }
  s.customRoles = customRoles;

  // levels
  const levels = (raw.levels && typeof raw.levels === "object" ? raw.levels : {}) as Raw;
  for (const [k, v] of Object.entries(levels).slice(0, 200)) {
    const key = str(k, 40);
    if (key) s.levels[key] = Math.round(num(v, 0, 5));
  }

  // projects
  const projects = Array.isArray(raw.projects) ? raw.projects.slice(0, 12) : [];
  s.projects = projects
    .map((p) => {
      const pr = (p && typeof p === "object" ? p : {}) as Raw;
      const name = str(pr.name, 60);
      const tech = Array.isArray(pr.tech)
        ? [...new Set(pr.tech.map((t) => str(t, 40)).filter(Boolean))].slice(0, 10)
        : [];
      return { name, tech };
    })
    .filter((p) => p.name.length >= 1 && p.tech.length > 0);

  // profile
  const prof = (raw.prof && typeof raw.prof === "object" ? raw.prof : {}) as Raw;
  s.prof = {
    cgpa: Math.round(num(prof.cgpa, 0, 10) * 10) / 10,
    solved: Math.round(num(prof.solved, 0, 5000)),
    certs: Math.round(num(prof.certs, 0, 50)),
    resume: Math.round(num(prof.resume, 0, 100)),
    interview: Math.round(num(prof.interview, 0, 100)),
    soft: Math.round(num(prof.soft, 0, 100)),
    pref: MODES.includes(prof.pref as WorkMode) ? (prof.pref as WorkMode) : "Hybrid",
    city: str(prof.city, 60),
  };

  // weights
  const w = (raw.weights && typeof raw.weights === "object" ? raw.weights : {}) as Raw;
  const weights = { ...blank().weights } as Weights;
  for (const [k] of CATS) {
    if (k in w) weights[k as CategoryKey] = Math.round(num(w[k], 0, 100));
  }
  s.weights = weights;

  // connections
  const c = (raw.connect && typeof raw.connect === "object" ? raw.connect : {}) as Raw;
  const gh = (c.gh && typeof c.gh === "object" ? c.gh : {}) as Raw;
  const lc = (c.lc && typeof c.lc === "object" ? c.lc : {}) as Raw;
  const li = (c.li && typeof c.li === "object" ? c.li : {}) as Raw;
  s.connect = {
    done: !!c.done,
    email: typeof c.email === "string" && c.email.trim() ? c.email.trim().slice(0, 200) : email,
    gh: {
      user: str(gh.user, 40),
      linked: !!gh.linked,
      repos: Math.round(num(gh.repos, 0, 100000)),
      stars: Math.round(num(gh.stars, 0, 10_000_000)),
      commits: Math.round(num(gh.commits, 0, 1_000_000)),
      langs: typeof gh.langs === "string" ? gh.langs.replace(/[<>]/g, "").slice(0, 200) : "",
    },
    lc: {
      user: str(lc.user, 40),
      linked: !!lc.linked,
      easy: Math.round(num(lc.easy, 0, 100000)),
      medium: Math.round(num(lc.medium, 0, 100000)),
      hard: Math.round(num(lc.hard, 0, 100000)),
      streak: Math.round(num(lc.streak, 0, 100000)),
    },
    li: {
      url: typeof li.url === "string" ? li.url.trim().slice(0, 200) : "",
      linked: !!li.linked,
      checks: (() => {
        const out: Record<string, boolean> = {};
        const ck = (li.checks && typeof li.checks === "object" ? li.checks : {}) as Raw;
        for (const [k] of LI_CHECKS) out[k] = !!ck[k];
        return out;
      })(),
    },
  };

  // done steps
  const done = (raw.done && typeof raw.done === "object" ? raw.done : {}) as Raw;
  const doneOut: StudentState["done"] = {};
  for (const [roleKey, skills] of Object.entries(done).slice(0, 20)) {
    const rk = str(roleKey, 40);
    if (!rk || !skills || typeof skills !== "object") continue;
    const inner: Record<string, { prev: number; req: number }> = {};
    for (const [sk, flag] of Object.entries(skills as Raw).slice(0, 40)) {
      const key = str(sk, 40);
      const f = (flag && typeof flag === "object" ? flag : {}) as Raw;
      if (key) inner[key] = { prev: Math.round(num(f.prev, 0, 5)), req: Math.round(num(f.req, 1, 5, 1)) };
    }
    doneOut[rk] = inner;
  }
  s.done = doneOut;

  // saved jobs
  s.saved = Array.isArray(raw.saved)
    ? [...new Set(raw.saved.map((x) => Number(x)).filter((x) => Number.isFinite(x)))].slice(0, 300)
    : [];

  // guides
  const guides = (raw.guides && typeof raw.guides === "object" ? raw.guides : {}) as Raw;
  const guideOut: StudentState["guides"] = {};
  for (const [k, g] of Object.entries(guides).slice(0, 20)) {
    const key = str(k, 40);
    const gg = (g && typeof g === "object" ? g : {}) as Raw;
    const text = typeof gg.text === "string" ? gg.text.replace(/[<>]/g, "").slice(0, 8000) : "";
    if (key && text) {
      guideOut[key] = {
        text,
        level: (["Beginner", "Average", "Advanced"].includes(String(gg.level))
          ? gg.level
          : "Beginner") as StudentState["guides"][string]["level"],
        pct: Math.round(num(gg.pct, 0, 100)),
        at: num(gg.at, 0, Date.now() + 1e12, Date.now()),
      };
    }
  }
  s.guides = guideOut;

  // chat (kept short; the source of truth is the CoachMessage collection)
  s.chat = Array.isArray(raw.chat)
    ? (raw.chat as Raw[])
        .slice(-40)
        .map((m) => {
          const mr = (m && typeof m === "object" ? m : {}) as Raw;
          const role = mr.role === "assistant" ? "assistant" : "user";
          const content = typeof mr.content === "string" ? mr.content.replace(/[<>]/g, "").slice(0, 4000) : "";
          return { role, content } as StudentState["chat"][number];
        })
        .filter((m) => m.content.length > 0)
    : [];

  return s;
}
