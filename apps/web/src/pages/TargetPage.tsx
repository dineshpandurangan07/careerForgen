import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { allRoles, cleanName, cleanRole, normS, type Role } from "@careerforge/shared";
import { ApiError, api } from "../api/client";
import { PageHead } from "../components/PageHead";
import { useStore } from "../context/StoreContext";

function matchRoles(q: string, roles: Record<string, Role>) {
  const toks = q.toLowerCase().split(/[^a-z0-9+#]+/).filter((t) => t.length > 1);
  if (!toks.length) return [];
  return Object.entries(roles)
    .map(([k, r]) => {
      const hay = `${r.name} ${r.alias || ""}`.toLowerCase();
      return { k, r, score: toks.filter((t) => hay.includes(t)).length / toks.length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export default function TargetPage() {
  const { state, update, aiEnabled, toast } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [manual, setManual] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const roles = allRoles(state);
  const cur = roles[state.role] || roles.fullstack;
  const matches = matchRoles(q, roles);
  const name = cleanName(q, 60);

  function setTarget(key: string) {
    update((s) => {
      s.role = key;
      s.targetSet = true;
    });
    toast(`Target set: ${allRoles(state)[key]?.name || key}`);
    navigate("/guidance");
  }

  async function buildRole() {
    if (name.length < 2) {
      setErr("Type a role name first.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const { roleKey, role } = await api.targetRole(name);
      update((s) => {
        s.customRoles[roleKey] = role;
        s.role = roleKey;
        s.targetSet = true;
      });
      setQ("");
      toast(`Target set: ${role.name}`);
      navigate("/guidance");
    } catch (e) {
      setErr(
        e instanceof ApiError && e.errorCode === "ai_disabled"
          ? "The AI plan builder isn't configured. Pick a listed role or list the skills yourself below."
          : "We couldn't build a plan for that. Check the role name, pick a listed role, or list the skills yourself below.",
      );
    } finally {
      setBusy(false);
    }
  }

  function manualRole() {
    const clean = cleanName(q, 60);
    const skills = manual.split(/[,\n]/);
    const r = cleanRole({ name: clean, reqs: skills.map((s) => [s, 3]) }, clean, 3);
    if (!clean || !r) {
      setErr("Enter a role name and at least 3 skills, separated by commas.");
      return;
    }
    const key = `c_${normS(r.name).slice(0, 30)}`;
    update((s) => {
      s.customRoles[key] = { ...r, key };
      s.role = key;
      s.targetSet = true;
    });
    toast(`Target set: ${r.name}`);
    navigate("/guidance");
  }

  const useBtn = (k: string, r: Role) => (
    <div className="field" style={{ alignItems: "flex-start" }} key={k}>
      <span>
        <b>{r.name}</b>
        {r.custom ? <span className="chip">Yours</span> : null}
        <br />
        <span className="note">{r.about || ""}</span>
      </span>
      <button className="btn sm primary" onClick={() => setTarget(k)}>
        Use this
      </button>
    </div>
  );

  return (
    <>
      <PageHead title="Your target role" sub="Tell us the job you want. Your skill gap, roadmap, guidance and coach all follow this choice, and you can change it any time." role={false} />
      {state.targetSet && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="head-row">
            <h2>Current target</h2>
            <span className="chip ok">{cur.name}</span>
          </div>
          <p style={{ margin: "0 0 10px" }}>{cur.about || ""}</p>
          <button className="btn sm" onClick={() => navigate("/guidance")}>
            See my guidance
          </button>
        </section>
      )}
      <section className="card">
        <h2>What role do you want?</h2>
        <div className="fld">
          <label htmlFor="tq">Type any role</label>
          <input
            id="tq"
            type="search"
            value={q}
            maxLength={60}
            autoComplete="off"
            placeholder="For example: Cybersecurity Analyst, UI/UX Designer, DevOps Engineer"
            disabled={busy}
            onChange={(e) => {
              setQ(e.target.value);
              setErr("");
            }}
          />
        </div>
        {err && (
          <div className="formerr" role="alert">
            {err}
          </div>
        )}
        {busy ? (
          <p className="note" role="status">
            Building your plan for “{name}”. This can take up to a minute.
          </p>
        ) : q ? (
          <>
            {matches.length ? (
              <>
                <p className="note" style={{ margin: "6px 0 0" }}>Roles we already have that match:</p>
                {matches.map((m) => useBtn(m.k, m.r))}
              </>
            ) : (
              <p className="note">We don't have a ready-made plan for that role yet.</p>
            )}
            {aiEnabled ? (
              <div style={{ marginTop: 14 }}>
                <button className={`btn ${matches.length ? "" : "primary"}`} onClick={() => void buildRole()}>
                  Build a plan for “{name}”
                </button>
                <p className="note" style={{ margin: "6px 0 0" }}>
                  The coach designs the skill list for this role. Review it after, since it is a guide rather than an official standard.
                </p>
              </div>
            ) : (
              <p className="note" style={{ marginTop: 12 }}>
                The AI plan builder isn't available. Pick a listed role or list the skills yourself below.
              </p>
            )}
            <details style={{ marginTop: 14 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Or list the skills yourself</summary>
              <div className="fld" style={{ marginTop: 10 }}>
                <label htmlFor="tm">Skills for “{name}”, in the order you'd learn them</label>
                <textarea id="tm" rows={3} maxLength={600} placeholder="HTML, CSS, JavaScript, Git" value={manual} onChange={(e) => setManual(e.target.value)} />
              </div>
              <button className="btn" onClick={manualRole}>
                Create this role
              </button>
            </details>
          </>
        ) : (
          <>
            <p className="note" style={{ margin: "6px 0 10px" }}>Not sure yet? Start from a popular role. You can switch later.</p>
            {Object.entries(roles).map(([k, r]) => useBtn(k, r))}
          </>
        )}
      </section>
    </>
  );
}
