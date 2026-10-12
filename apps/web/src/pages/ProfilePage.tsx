import { useState } from "react";
import { CATS, DEFAULT_WEIGHTS, canon, lcTotal, type CategoryKey } from "@careerforge/shared";
import { PageHead } from "../components/PageHead";
import { useStore } from "../context/StoreContext";

export default function ProfilePage() {
  const { state, update, reset, toast } = useStore();
  const [arm, setArm] = useState(false);
  const [pName, setPName] = useState("");
  const [pTech, setPTech] = useState("");
  const [pErr, setPErr] = useState("");

  const p = state.prof;
  const tot = Object.values(state.weights).reduce((a, b) => a + b, 0) || 1;

  const num = (key: "cgpa" | "certs" | "resume" | "interview" | "soft" | "solved", label: string, min: number, max: number, step: number) => (
    <div className="field">
      <label htmlFor={`p_${key}`}>{label}</label>
      <input
        id={`p_${key}`}
        type="number"
        data-prof={key}
        min={min}
        max={max}
        step={step}
        defaultValue={p[key]}
        style={{ width: 100 }}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) {
            update((s) => {
              s.prof[key] = Math.min(max, Math.max(min, v));
            });
          }
        }}
      />
    </div>
  );

  function addProject() {
    const n = pName.trim();
    const tech = [...new Set(pTech.split(",").map((x) => x.trim()).filter(Boolean).map((x) => canon(state.customRoles, x)))].slice(0, 10);
    if (n.length < 2) {
      setPErr("Enter a project name.");
      return;
    }
    if (!tech.length) {
      setPErr("Add at least one technology, like React.");
      return;
    }
    if (state.projects.length >= 12) {
      setPErr("You can add up to 12 projects.");
      return;
    }
    update((s) => {
      s.projects.push({ name: n.slice(0, 60), tech });
    });
    setPName("");
    setPTech("");
    setPErr("");
    toast("Project added");
  }

  return (
    <>
      <PageHead title="Profile and scoring" sub="Change your details or how each area counts. Everything on the overview recalculates instantly." role={false} />
      <div className="grid two">
        <section className="card">
          <h2>Your details</h2>
          {num("cgpa", "CGPA (0–10)", 0, 10, 0.1)}
          {state.connect.lc.linked ? (
            <div className="field">
              <span>Coding problems solved</span>
              <span className="note">From LeetCode: {lcTotal(state)}</span>
            </div>
          ) : (
            num("solved", "Coding problems solved", 0, 2000, 1)
          )}
          {num("certs", "Certifications", 0, 20, 1)}
          {num("resume", "Resume score (0–100)", 0, 100, 1)}
          {num("interview", "Mock interview score (0–100)", 0, 100, 1)}
          {num("soft", "Soft skills self-rating (0–100)", 0, 100, 1)}
          <div className="field">
            <label htmlFor="p_city">Preferred city</label>
            <input
              id="p_city"
              type="text"
              maxLength={60}
              defaultValue={p.city}
              style={{ width: 160 }}
              onChange={(e) =>
                update((s) => {
                  s.prof.city = e.target.value.slice(0, 60);
                })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="prefMode">Preferred work mode</label>
            <select
              id="prefMode"
              value={p.pref}
              onChange={(e) =>
                update((s) => {
                  s.prof.pref = e.target.value as typeof s.prof.pref;
                })
              }
            >
              {["Remote", "Hybrid", "On-site"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            className="btn"
            style={{ marginTop: 14 }}
            onClick={() => {
              if (!arm) {
                setArm(true);
                return;
              }
              setArm(false);
              void reset();
              toast("Your data was reset");
            }}
          >
            {arm ? "Click again to erase my data" : "Reset my data"}
          </button>
        </section>
        <section className="card">
          <h2>Scoring weights</h2>
          <p className="note" style={{ marginTop: -6 }}>
            Weights are normalised, so they always add up to 100%. In the full product, admins set the defaults.
          </p>
          {CATS.map(([k, n]) => (
            <div className="field" key={k}>
              <label htmlFor={`w_${k}`}>{n}</label>
              <input
                type="range"
                id={`w_${k}`}
                min={0}
                max={50}
                value={state.weights[k as CategoryKey]}
                onChange={(e) =>
                  update((s) => {
                    s.weights[k as CategoryKey] = Number(e.target.value);
                  })
                }
              />
              <b style={{ width: 40, textAlign: "right" }}>{Math.round((state.weights[k as CategoryKey] / tot) * 100)}%</b>
            </div>
          ))}
          <button
            className="btn"
            style={{ marginTop: 14 }}
            onClick={() =>
              update((s) => {
                s.weights = { ...DEFAULT_WEIGHTS };
              })
            }
          >
            Restore default weights
          </button>
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2>Your projects</h2>
        {state.projects.length ? (
          state.projects.map((pr, i) => (
            <div className="field" key={`${pr.name}-${i}`}>
              <span>
                <b>{pr.name}</b>
                <br />
                {pr.tech.map((t) => (
                  <span className="chip" key={t}>{t}</span>
                ))}
              </span>
              <button
                className="btn sm"
                aria-label={`Remove ${pr.name}`}
                onClick={() =>
                  update((s) => {
                    s.projects.splice(i, 1);
                  })
                }
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="empty">No projects yet. Add one you've built, even a small one.</p>
        )}
        <div className="cgrid" style={{ marginTop: 12 }}>
          <div className="fld">
            <label htmlFor="pName">Project name</label>
            <input id="pName" maxLength={60} autoComplete="off" value={pName} onChange={(e) => setPName(e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="pTech">Technologies, separated by commas</label>
            <input id="pTech" placeholder="React, Node.js, MongoDB" autoComplete="off" value={pTech} onChange={(e) => setPTech(e.target.value)} />
          </div>
        </div>
        <div className="err" role="alert">{pErr}</div>
        <button className="btn primary" style={{ marginTop: 8 }} onClick={addProject}>
          Add project
        </button>
      </section>
    </>
  );
}
