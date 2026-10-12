import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PLAN,
  actions,
  careerRank,
  heat,
  levelCls,
  levelOf,
  lcTotal,
  localGuide,
  lvl,
  overall,
  pct,
  perfGit,
  perfLeet,
  perfLinked,
  roleOf,
  type Perf,
} from "@careerforge/shared";
import { aiStream } from "../api/client";
import { PageHead } from "../components/PageHead";
import { useStore } from "../context/StoreContext";
import { md } from "../lib/md";

export default function GuidancePage() {
  const { state, jobs, update, aiEnabled, toast } = useStore();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const ctrlRef = useRef<AbortController | null>(null);
  const triedRef = useRef<Record<string, boolean>>({});

  const role = roleOf(state);
  const o = overall(state);
  const L = levelOf(o);
  const guide = state.guides[state.role];
  const c = state.connect;

  const genGuide = async () => {
    if (busy || !aiEnabled) return;
    setBusy(true);
    setText("");
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    try {
      const full = await aiStream.guide({
        signal: ctrl.signal,
        onDelta: (t) => setText(t),
      });
      if (full && full.length > 150) {
        const cur = overall(state);
        update((s) => {
          s.guides[s.role] = { text: full, level: levelOf(cur), pct: pct(cur), at: Date.now() };
        });
        toast("Your guide is ready");
      }
    } catch {
      if (!ctrl.signal.aborted) toast("Couldn't write the guide just now. Showing the built-in guide.");
    } finally {
      setBusy(false);
      setText("");
      ctrlRef.current = null;
    }
  };

  useEffect(() => {
    if (aiEnabled && !state.guides[state.role] && !triedRef.current[state.role]) {
      triedRef.current[state.role] = true;
      void genGuide();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiEnabled, state.role]);

  const guideBody = busy
    ? text
      ? md(text)
      : '<p class="thinking">Writing your guide…</p>'
    : guide
      ? md(guide.text)
      : md(localGuide(state));

  const perf: (Perf | null)[] = [perfGit(state), perfLeet(state), perfLinked(state)];
  const perfNames = ["GitHub", "LeetCode", "LinkedIn"];

  const rank = careerRank(state, jobs);
  const top = rank.slice(0, 4);
  const tr = rank.find((r) => r.key === state.role);
  if (tr && !top.includes(tr)) top.push(tr);

  const say = {
    Beginner: "Focus on fundamentals and one finished project before applying widely.",
    Average: "You have a base. Depth, a deployed project and interview practice will move you fastest.",
    Advanced: "You're competitive for most roles here. Specialise, polish and aim a step higher.",
  }[L];

  const ev = [
    c.gh.linked ? `GitHub: ${c.gh.repos} repos, ${c.gh.commits} commits in 90 days` : "",
    c.lc.linked ? `LeetCode: ${lcTotal(state)} solved (${c.lc.easy}/${c.lc.medium}/${c.lc.hard})` : "",
    c.li.linked ? "LinkedIn linked" : "",
    c.done && c.email ? "Email saved" : "",
  ].filter(Boolean);

  const acts = actions(state).slice(0, 7);
  const noLevels = !Object.values(state.levels).some((v) => v > 0);
  const stale = guide && (guide.level !== L || Math.abs(guide.pct - pct(o)) >= 10);

  return (
    <>
      <PageHead title="Career guidance" sub="Built from your skills, scores and connected activity." role={false} />

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="head-row">
          <h2>Your guide for {role.name}</h2>
          <span className={`chip ${levelCls(o)}`}>{L} level</span>
        </div>
        <div className="guide" dangerouslySetInnerHTML={{ __html: guideBody }} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
          {aiEnabled && (
            <button className={`btn sm ${guide && !stale ? "" : "primary"}`} disabled={busy} onClick={() => void genGuide()}>
              {guide ? (stale ? "Update my guide" : "Refresh guide") : "Write my personal guide"}
            </button>
          )}
          {busy && (
            <button className="btn sm" onClick={() => ctrlRef.current?.abort()}>
              Stop
            </button>
          )}
          {noLevels ? (
            <button className="btn sm" onClick={() => navigate("/gap")}>Rate my current skills</button>
          ) : (
            <button className="btn sm" onClick={() => navigate("/roadmap")}>Open my roadmap</button>
          )}
          <button className="btn sm" onClick={() => navigate("/coach", { state: { prompt: `I have questions about my guide for ${role.name}. Start by asking me what I'm confused about.` } })}>
            Ask a question
          </button>
        </div>
        <p className="note" style={{ margin: "10px 0 0" }}>
          {guide
            ? `Written by the coach for your profile on ${new Date(guide.at).toLocaleDateString()}.${stale ? " Your profile has changed since, so an update is worth it." : ""}`
            : `Built from your target role and current skills.${aiEnabled ? " Tap the button for a guide the coach writes just for you." : ""}`}{" "}
          Guidance only, not a promise of any job.
        </p>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="head-row">
          <h2>How your profiles are performing</h2>
          <button className="btn sm" onClick={() => navigate("/connect")}>Update</button>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}>
          {perf.map((p, i) =>
            p ? (
              <div key={perfNames[i]}>
                <div className="head-row" style={{ marginBottom: 4 }}>
                  <h3>{p.name}</h3>
                  <span className={`chip ${levelCls(p.score)}`}>{levelOf(p.score)} · {pct(p.score)}%</span>
                </div>
                <div style={{ height: 10, background: "var(--soft)", borderRadius: 99, overflow: "hidden", margin: "6px 0", boxShadow: "inset 0 2px 4px rgba(94,67,216,.14)" }}>
                  <b style={{ display: "block", height: "100%", width: `${pct(p.score)}%`, background: heat(p.score), borderRadius: 99 }} />
                </div>
                <p className="note" style={{ margin: "0 0 6px" }}>{p.facts}</p>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {p.tips.map((t) => (
                    <li key={t} style={{ margin: "3px 0" }}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div key={perfNames[i]}>
                <h3>{perfNames[i]}</h3>
                <p className="note">Not connected yet. Connect it to see how it's performing and what to fix.</p>
                <button className="btn sm" onClick={() => navigate("/connect")}>Connect {perfNames[i]}</button>
              </div>
            ),
          )}
        </div>
        <p className="note" style={{ margin: "12px 0 0" }}>
          Scores come from the numbers and checks you entered. They are estimates to guide your practice, not what recruiters will decide.
        </p>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="head-row">
          <h2>Your stage</h2>
          <span className={`chip ${levelCls(o)}`}>{L} · {pct(o)}%</span>
        </div>
        <p style={{ margin: "0 0 10px" }}>
          {say}{" "}
          <button className="btn sm" onClick={() => navigate("/coach", { state: { prompt: "Explain my guidance and tell me the first thing to do this week." } })}>
            Ask the coach
          </button>
        </p>
        {ev.length ? (
          ev.map((x) => (
            <span className="chip" key={x}>{x}</span>
          ))
        ) : (
          <span className="note">
            No accounts connected yet.{" "}
            <button className="btn sm" onClick={() => navigate("/connect")}>Connect accounts</button>
          </span>
        )}
        {c.gh.linked && c.gh.langs && <div className="note" style={{ marginTop: 8 }}>Languages you reported on GitHub: {c.gh.langs}</div>}
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <div className="head-row">
          <h2>About {role.name}</h2>
          <button className="btn sm" onClick={() => navigate("/target")}>Change target</button>
        </div>
        <p style={{ margin: "0 0 10px" }}>{role.about || "A role you chose yourself. The skills below are the ones needed to get started."}</p>
        <p className="note" style={{ margin: "0 0 6px" }}>Skills to build, in learning order:</p>
        {role.reqs.map(([sk, n]) => (
          <span className={`chip ${lvl(state, sk) >= n ? "ok" : ""}`} key={sk}>
            {lvl(state, sk) >= n ? "✓ " : ""}
            {sk}
          </span>
        ))}
        <div style={{ marginTop: 10 }}>
          <button className="btn sm" onClick={() => navigate("/coach", { state: { prompt: `Tell me what a ${role.name} does day to day, what a beginner should learn first, and how to get my first job in this role.` } })}>
            Ask the coach about this role
          </button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 18 }}>
        <h2>Career paths that fit you now</h2>
        {top.map((r, i) => (
          <div className="job" key={r.key}>
            <div>
              <h3>
                {r.name}
                {r.key === state.role ? <span className="chip"> Current target</span> : null}
              </h3>
              <div className="note">
                {r.jobs} of {jobs.length} demo openings relate to this · skills fit {pct(r.fit)}%
              </div>
              <div style={{ marginTop: 6 }}>
                {r.have.map((s) => (
                  <span className="chip ok" key={s}>✓ {s}</span>
                ))}
                {r.lack.slice(0, 4).map((s) => (
                  <span className="chip bad" key={s}>{s}</span>
                ))}
              </div>
              <p className="note" style={{ margin: "6px 0 0" }}>
                {i === 0 ? "Closest to your current skills and the most openings." : "A reachable second option."}
                {r.lack.length ? ` Learn ${r.lack.slice(0, 2).join(" and ")} first.` : " You meet every skill target."}
              </p>
            </div>
            <div className="match">
              <b style={{ color: heat(r.fit) }}>{pct(r.fit)}%</b>
              <span className="note">skills fit</span>
              {r.key !== state.role && (
                <button
                  className="btn sm"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    update((s) => {
                      s.role = r.key;
                      s.targetSet = true;
                    });
                    toast("Target role updated");
                  }}
                >
                  Set as target
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <div className="grid two">
        <section className="card">
          <h2>Your next 12 weeks</h2>
          {PLAN[L].map(([w, t]) => (
            <div className="field" style={{ alignItems: "flex-start" }} key={w}>
              <b style={{ minWidth: 82 }}>{w}</b>
              <span>{t}</span>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>What to do first</h2>
          {acts.map((a) => (
            <div className="field" style={{ alignItems: "flex-start" }} key={a.t}>
              <span>
                <b>{a.t}</b>
                <br />
                <span className="note">{a.why}</span>
              </span>
            </div>
          ))}
        </section>
      </div>

      <p className="note" style={{ marginTop: 12 }}>
        Guidance is based on the information you entered and is meant to help you plan. It doesn't guarantee any hiring outcome.
      </p>
    </>
  );
}
