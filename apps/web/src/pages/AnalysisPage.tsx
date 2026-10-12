import {
  allRoles,
  heat,
  lvl,
  match,
  pct,
  relatedJobs,
  roleOf,
  skillLevelCls,
  skillLevelName,
} from "@careerforge/shared";
import { useStore } from "../context/StoreContext";

export default function AnalysisPage() {
  const { state, jobs } = useStore();
  const role = roleOf(state);

  const rows = jobs.map((j) => ({ j, m: match(state, j) }));
  const ready = rows.filter((r) => r.m.total >= 0.7).length;
  const close = rows.filter((r) => r.m.total >= 0.5 && r.m.total < 0.7).length;
  const stretch = rows.length - ready - close;

  const dem: Record<string, { req: number; n: number }> = {};
  jobs.forEach((j) => {
    j.req.forEach((s) => {
      dem[s] = dem[s] || { req: 0, n: 0 };
      dem[s].req++;
    });
    [...j.req, ...j.pref].forEach((s) => {
      dem[s] = dem[s] || { req: 0, n: 0 };
      dem[s].n++;
    });
  });
  const list = Object.entries(dem)
    .map(([s, d]) => ({ s, n: d.n, req: d.req, l: lvl(state, s) }))
    .sort((a, b) => b.n - a.n || b.req - a.req);
  const pri = list.filter((x) => x.n >= 3 && x.l < 3);
  const top = pri[0];

  const fam = Object.entries(allRoles(state))
    .map(([k, r]) => {
      const rs = relatedJobs({ ...state, role: k }, jobs).map((j) => ({ j, m: match(state, j) }));
      return { name: r.name, n: rs.length, avg: rs.length ? rs.reduce((a, x) => a + x.m.total, 0) / rs.length : 0 };
    })
    .filter((f) => f.n)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const tj = relatedJobs(state, jobs)
    .map((j) => ({ j, m: match(state, j) }))
    .sort((a, b) => b.m.total - a.m.total);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Job analysis</h1>
          <p>What employers ask for, and how you compare. Based on the {jobs.length} demo openings; in the full product this reads live postings.</p>
        </div>
      </div>
      <div className="grid stats3" style={{ marginBottom: 18 }}>
        <div className="card stat">
          <b style={{ color: "var(--ok)" }}>{ready}</b>Within reach now<div className="note">70% fit or higher</div>
        </div>
        <div className="card stat">
          <b style={{ color: "var(--warn)" }}>{close}</b>Close<div className="note">50–69%, one or two gaps</div>
        </div>
        <div className="card stat">
          <b style={{ color: "var(--bad)" }}>{stretch}</b>Stretch<div className="note">Below 50%</div>
        </div>
      </div>
      <section className="card" style={{ marginBottom: 18 }}>
        <h2>Insight</h2>
        <p style={{ margin: 0 }}>
          {top
            ? `${top.s} appears in ${top.n} of ${jobs.length} openings and you're at ${skillLevelName(top.l).toLowerCase()} level. ${pri.length > 1 ? `${pri.slice(1, 3).map((x) => x.s).join(" and ")} ${pri.length > 2 ? "are" : "is"} next.` : ""} Improving these opens the most roles.`
            : "You meet the bar for every skill that appears in three or more openings."}
        </p>
      </section>
      <section className="card" style={{ marginBottom: 18 }}>
        <h2>Openings closest to {role.name}</h2>
        {tj.length ? (
          tj.map(({ j, m }) => (
            <div className="field" key={String(j.id)}>
              <span>
                {j.title}
                <br />
                <span className="note">{j.co} · {j.loc} · {j.mode}</span>
              </span>
              <b style={{ color: heat(m.total) }}>{pct(m.total)}%</b>
            </div>
          ))
        ) : (
          <p className="empty">None of the demo openings match this role. The full product reads live postings for any role you choose.</p>
        )}
      </section>
      <section className="card" style={{ marginBottom: 18 }}>
        <h2>Most requested skills</h2>
        <div className="scroll">
          {list.map((x) => (
            <div className="dem" key={x.s}>
              <b>{x.s}</b>
              <div className="t">
                <b style={{ width: `${(x.n / jobs.length) * 100}%` }} />
              </div>
              <span className="note">{x.n} of {jobs.length} openings</span>
              <span className={`chip ${skillLevelCls(x.l)}`}>{skillLevelName(x.l)}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Fit by role</h2>
        {fam.map((f) => (
          <div className="strip" key={f.name}>
            <div>
              {f.name}
              <small>{f.n} opening{f.n > 1 ? "s" : ""}</small>
            </div>
            <div className="t">
              <b style={{ width: `${pct(f.avg)}%`, background: heat(f.avg) }} />
            </div>
            <div className="v">{pct(f.avg)}%</div>
          </div>
        ))}
      </section>
    </>
  );
}
