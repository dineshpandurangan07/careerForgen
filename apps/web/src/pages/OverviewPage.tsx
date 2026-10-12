import { useNavigate } from "react-router-dom";
import { CATS, catScores, firstName, heat, levelOf, match, overall, pct, roadmap, roleOf } from "@careerforge/shared";
import { Gauge } from "../components/Gauge";
import { PageHead } from "../components/PageHead";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

export default function OverviewPage() {
  const { state, jobs, loadSample } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const c = catScores(state);
  const o = overall(state);
  const rm = roadmap(state).filter((r) => !r.done);
  const gs = CATS.map(([k, n]) => ({ k, n, v: c[k] })).sort((a, b) => a.v - b.v);
  const next = rm[0];
  const apps = Object.entries(state.applied).filter(([, s]) => s !== "Withdrawn");
  const tot = Object.values(state.weights).reduce((a, b) => a + b, 0) || 1;

  const ask = (prompt: string) => navigate("/coach", { state: { prompt } });

  const setupItems = [
    { t: "Choose your target role", d: state.targetSet, go: "/target" },
    { t: "Set your skill levels", d: Object.values(state.levels).some((v) => v > 0), go: "/gap" },
    { t: "Add your marks and preferences", d: state.prof.cgpa > 0, go: "/profile" },
    { t: "Add a project you've built", d: state.projects.length > 0, go: "/profile" },
    { t: "Connect GitHub, LeetCode or LinkedIn", d: state.connect.gh.linked || state.connect.lc.linked || state.connect.li.linked, go: "/connect" },
  ];
  const done = setupItems.filter((i) => i.d).length;
  const empty = !setupItems[1].d && !setupItems[2].d && !setupItems[3].d;

  return (
    <>
      <PageHead
        title={`Hi, ${firstName(user?.name)}`}
        sub={state.targetSet ? `Working toward ${roleOf(state).name}. Here's where you stand today.` : "Choose a target role to get a plan made for you."}
      />

      {done < setupItems.length && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="head-row">
            <h2>Get set up</h2>
            <span className="chip">{done} of {setupItems.length} done</span>
          </div>
          <p className="note" style={{ margin: "-4px 0 8px" }}>
            Your score and guidance become accurate as you fill these in. New to this? Start with the first step, or ask the coach.
          </p>
          {setupItems.map((i) => (
            <div className="field" key={i.t}>
              <span>{i.t}</span>
              {i.d ? <span className="chip ok">Done</span> : <button className="btn sm" onClick={() => navigate(i.go)}>Do this</button>}
            </div>
          ))}
          {empty && (
            <button className="btn sm" style={{ marginTop: 12 }} onClick={() => void loadSample()}>
              Or preview with a sample student profile
            </button>
          )}
        </section>
      )}

      <div className="card" style={{ marginBottom: 18, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <h3>Not sure where to begin?</h3>
          <p className="note" style={{ margin: "4px 0 0" }}>Ask the career coach anything: what to learn first, which role fits you, how to prepare.</p>
        </div>
        <button className="btn primary" onClick={() => ask("I'm not sure where to start. Guide me step by step.")}>
          Ask the coach
        </button>
      </div>

      <div className="grid hero">
        <Gauge value={o} caption={`Career readiness for ${roleOf(state).name}. Colour warms as you get closer to ready.`} />
        <section className="card">
          <h2>What makes up your score</h2>
          {CATS.map(([k, n]) => (
            <div className="strip" key={k}>
              <div>
                {n}
                <small>{levelOf(c[k])} · weight {Math.round((state.weights[k] / tot) * 100)}%</small>
              </div>
              <div className="t">
                <b style={{ width: `${pct(c[k])}%`, background: heat(c[k]) }} />
              </div>
              <div className="v">{pct(c[k])}%</div>
            </div>
          ))}
        </section>
      </div>

      <div className="grid two" style={{ marginTop: 18 }}>
        <section className="card">
          <h2>Do this next</h2>
          {next ? (
            <>
              <h3>{next.skill}</h3>
              <p className="note">Level {next.cur} now, {next.req} needed. About {next.weeks} week{next.weeks > 1 ? "s" : ""}.</p>
              <p className="task">{next.task[0]}</p>
              <button className="btn primary" style={{ marginTop: 12 }} onClick={() => navigate("/roadmap")}>
                Open roadmap
              </button>
            </>
          ) : (
            <>
              <p className="empty">Every skill for this role has reached its target level. Explore matching jobs.</p>
              <button className="btn primary" onClick={() => navigate("/jobs")}>See jobs</button>
            </>
          )}
        </section>
        <section className="card">
          <h2>Strengths and weak spots</h2>
          <p className="note" style={{ margin: "0 0 6px" }}>Strongest</p>
          {gs.slice(-2).reverse().map((x) => (
            <span className="chip ok" key={x.k}>{x.n} {pct(x.v)}%</span>
          ))}
          <p className="note" style={{ margin: "12px 0 6px" }}>Needs work</p>
          {gs.slice(0, 3).map((x) => (
            <span className="chip bad" key={x.k}>{x.n} {pct(x.v)}%</span>
          ))}
        </section>
        <section className="card">
          <h2>Applications</h2>
          {apps.length ? (
            apps.map(([id, s]) => {
              const j = jobs.find((j) => String(j.id) === id);
              if (!j) return null;
              return (
                <div className="field" key={id}>
                  <span>
                    {j.title}
                    <br />
                    <span className="note">{j.co}</span>
                  </span>
                  <span className="chip">{s}</span>
                </div>
              );
            })
          ) : (
            <p className="empty">You haven't applied anywhere yet. Matching jobs are ready when you are.</p>
          )}
        </section>
        <section className="card">
          <h2>Top matches</h2>
          {jobs
            .map((j) => ({ j, m: match(state, j) }))
            .sort((a, b) => b.m.total - a.m.total)
            .slice(0, 3)
            .map(({ j, m }) => (
              <div className="field" key={String(j.id)}>
                <span>
                  {j.title}
                  <br />
                  <span className="note">{j.co}</span>
                </span>
                <b style={{ color: heat(m.total) }}>{pct(m.total)}%</b>
              </div>
            ))}
        </section>
      </div>
    </>
  );
}
