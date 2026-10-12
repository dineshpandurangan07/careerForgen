import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { heat, match, pct, type WorkMode } from "@careerforge/shared";
import { api } from "../api/client";
import { useStore } from "../context/StoreContext";

const MODES: ("All" | WorkMode)[] = ["All", "Remote", "Hybrid", "On-site"];

export default function JobsPage() {
  const { state, jobs, update, toast } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"All" | WorkMode>("All");

  const query = q.toLowerCase();
  const list = jobs
    .filter((j) => (mode === "All" || j.mode === mode) && (!query || `${j.title}${j.co}${j.loc}${j.req.join(" ")}`.toLowerCase().includes(query)))
    .map((j) => ({ j, m: match(state, j) }))
    .sort((a, b) => b.m.total - a.m.total);

  async function apply(id: number | string) {
    const key = String(id);
    const j = jobs.find((x) => String(x.id) === key);
    const cur = state.applied[key];
    try {
      if (cur && cur !== "Withdrawn") {
        const { statusLabel } = await api.withdraw(id);
        update((s) => {
          s.applied[key] = statusLabel;
        });
        toast("Application withdrawn");
      } else {
        const { statusLabel } = await api.apply(id);
        update((s) => {
          s.applied[key] = statusLabel;
        });
        toast(`Applied to ${j?.title ?? "job"} at ${j?.co ?? ""}`);
      }
    } catch {
      toast("Couldn't update your application. Try again.");
    }
  }

  function toggleSave(id: number | string) {
    const sv = state.saved.includes(id);
    update((s) => {
      s.saved = sv ? s.saved.filter((x) => x !== id) : [...s.saved, id];
    });
    toast(sv ? "Removed from saved" : "Job saved");
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Jobs for you</h1>
          <p>Ranked by how your skills, projects, marks and preferences line up. A fit estimate, not a hiring prediction.</p>
        </div>
      </div>
      <div className="filters">
        <input type="search" placeholder="Search title, company, skill" value={q} aria-label="Search jobs" style={{ flex: 1, minWidth: 200 }} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Work mode" value={mode} onChange={(e) => setMode(e.target.value as "All" | WorkMode)}>
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <section className="card">
        {list.length ? (
          list.map(({ j, m }) => {
            const st = state.applied[String(j.id)];
            const active = st && st !== "Withdrawn";
            const sv = state.saved.includes(j.id);
            return (
              <article className="job" key={String(j.id)}>
                <div>
                  <h3>{j.title}</h3>
                  <div className="note">
                    {j.co} · {j.loc} · {j.mode} · ₹{j.lpa} LPA · min CGPA {j.min}
                  </div>
                  <div className="parts">
                    <div>
                      <b>{pct(m.skill)}%</b>Skills
                    </div>
                    <div>
                      <b>{pct(m.proj)}%</b>Projects
                    </div>
                    <div>
                      <b>{pct(m.edu)}%</b>Education
                    </div>
                    <div>
                      <b>{pct(m.pref)}%</b>Preferences
                    </div>
                  </div>
                  <div>
                    {m.matched.map((s) => (
                      <span className="chip ok" key={s}>✓ {s}</span>
                    ))}
                    {m.missing.map((s) => (
                      <span className="chip bad" key={s}>{s}</span>
                    ))}
                  </div>
                  <p className="note" style={{ margin: "8px 0 0" }}>
                    {m.missing.length
                      ? `Recommended mainly for ${m.matched.length ? m.matched.join(", ") : "your potential"}; closing ${m.missing.slice(0, 2).join(" and ")} would raise this match most.`
                      : "You meet the skill bar for every required skill."}
                  </p>
                </div>
                <div className="match">
                  <b style={{ color: heat(m.total) }}>{pct(m.total)}%</b>
                  <span className="note">fit</span>
                  <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                    <button className={`btn sm ${active ? "" : "primary"}`} onClick={() => void apply(j.id)}>
                      {active ? "Withdraw" : "Apply"}
                    </button>
                    <button className="btn sm" aria-pressed={sv} onClick={() => toggleSave(j.id)}>
                      {sv ? "Saved" : "Save"}
                    </button>
                    <button
                      className="btn sm"
                      onClick={() =>
                        navigate("/coach", {
                          state: { prompt: `Explain why ${j.title} at ${j.co} is a ${pct(m.total)}% fit for me and what to learn to improve my chances.` },
                        })
                      }
                    >
                      Ask coach
                    </button>
                  </div>
                  {active && (
                    <span className="chip" style={{ marginTop: 8 }}>
                      {st}
                    </span>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty">No jobs match those filters. Clear the search or switch work mode.</p>
        )}
      </section>
    </>
  );
}
