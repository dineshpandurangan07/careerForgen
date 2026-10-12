import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { loadProfile, saveState } from "./profile.js";
import { DEMO_LEVELS, DEMO_PROF, DEMO_PROJECTS } from "@careerforge/shared";
import { hashPassword } from "./password.js";

/** Fictional Indian-market demo data. Clearly labelled as demo in the UI. */
export const JOBS = [
  { id: 1, title: "Junior Full Stack Developer", co: "Kaveri Labs", loc: "Madurai", mode: "Hybrid", lpa: "5–7", min: 6.5, req: ["JavaScript", "React", "Node.js", "MongoDB", "REST APIs"], pref: ["Docker", "Git"] },
  { id: 2, title: "Software Engineer Trainee", co: "Nilgiri Payments", loc: "Chennai", mode: "On-site", lpa: "6–8", min: 7, req: ["JavaScript", "Node.js", "Express.js", "REST APIs", "Authentication"], pref: ["Docker"] },
  { id: 3, title: "Frontend Developer", co: "Vaigai Digital", loc: "Remote", mode: "Remote", lpa: "4–6", min: 6, req: ["HTML", "CSS", "JavaScript", "React", "Git"], pref: [] },
  { id: 4, title: "Backend Developer (Node)", co: "Sahyadri Cloud", loc: "Bengaluru", mode: "Hybrid", lpa: "8–11", min: 7.5, req: ["Node.js", "Express.js", "MongoDB", "Authentication", "Docker"], pref: ["REST APIs"] },
  { id: 5, title: "Data Analyst Intern", co: "Thamirabarani Analytics", loc: "Coimbatore", mode: "On-site", lpa: "3–4", min: 6.5, req: ["SQL", "Excel", "Python", "Data Visualization"], pref: ["Statistics"] },
  { id: 6, title: "Associate Java Developer", co: "Cauvery Systems", loc: "Chennai", mode: "On-site", lpa: "5–7", min: 7, req: ["Java", "SQL", "Spring Boot", "REST APIs"], pref: ["Git"] },
  { id: 7, title: "MERN Stack Intern", co: "Pandiyan Tech Studio", loc: "Remote", mode: "Remote", lpa: "3–5", min: 6, req: ["JavaScript", "React", "Node.js", "MongoDB"], pref: ["Git"] },
] as const;

async function upsertDemoUser(
  email: string,
  name: string,
  role: "STUDENT" | "RECRUITER" | "ADMIN",
  password: string,
) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name,
      role,
      passwordHash: await hashPassword(password),
      provider: "password",
      emailVerified: true,
    });
  }
  return user;
}

/**
 * Idempotently seeds demo jobs and demo accounts into the connected database.
 * Used by the `seed` script and automatically for the in-memory dev database.
 */
export async function seedDemoData(): Promise<void> {
  for (const j of JOBS) {
    await Job.updateOne({ id: j.id }, { $set: { ...j, status: "published" } }, { upsert: true });
  }

  const student = await upsertDemoUser("student@careerforge.dev", "Arvind Kumar", "STUDENT", "Password123");
  await upsertDemoUser("recruiter@careerforge.dev", "Meera Recruiter", "RECRUITER", "Password123");
  await upsertDemoUser("admin@careerforge.dev", "Site Admin", "ADMIN", "Password123");

  const { state } = await loadProfile(String(student._id), student.email);
  if (!Object.values(state.levels).some((v) => v > 0)) {
    state.levels = { ...DEMO_LEVELS };
    state.prof = { ...DEMO_PROF };
    state.projects = DEMO_PROJECTS.map((p) => ({ name: p.name, tech: [...p.tech] }));
    state.targetSet = true;
    state.connect.email = student.email;
    state.connect.gh = { user: "arvind-demo", linked: true, repos: 5, stars: 3, commits: 48, langs: "JavaScript, Python" };
    state.connect.lc = { user: "arvind_demo", linked: true, easy: 42, medium: 16, hard: 1, streak: 6 };
    state.connect.li = { url: "https://www.linkedin.com/in/arvind-demo", linked: true, checks: { photo: true, headline: true, about: true, projects: true, skills: true } };
    await saveState(String(student._id), state);
  }
}

export const DEMO_LOGINS = [
  { email: "student@careerforge.dev", role: "student" },
  { email: "recruiter@careerforge.dev", role: "recruiter" },
  { email: "admin@careerforge.dev", role: "admin" },
] as const;
