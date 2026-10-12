import { useNavigate } from "react-router-dom";
import { lvl, roadmap, roleOf } from "@careerforge/shared";
import { PageHead } from "../components/PageHead";
import { useStore } from "../context/StoreContext";

export default function RoadmapPage() {
  const { state, update, toast } = useStore();
  const navigate = useNavigate();
  const r = roadmap(state);
  const left = r.filter((x) => !x.done);
  const wk = left.reduce((a, x) => a + x.weeks, 0);

  function toggle(skill: string) {
    const req = roleOf(state).reqs.find((x) => x[0] === skill)?.[1] ?? 3;
    update((s) => {
      const d = (s.done[s.role] = s.done[s.role] || {});
      if (d[skill] !== undefined) {
        s.levels[skill] = d[skill].prev;
        delete d[skill];
      } else {
        d[skill] = { prev: lvl(s, skill), req };
        s.levels[skill] = req;
      }
    });
    const isDone = (state.done[state.role] || {})[skill] !== undefined;
    toast(isDone ? `${skill} restored` : `${skill} marked done. Readiness updated.`);
  }

  return (
    <>
      <PageHead
        title="Learning roadmap"
        sub={left.length ? `${left.length} steps left, roughly ${wk} weeks of focused practice. Ordered so foundations come first.` : "Roadmap complete for this role."}
        role={false}
      />
      <section className="card">
        {r.length ? (
          r.map((x, i) => (
            <div className={`step ${x.done ? "done" : ""}`} key={x.skill}>
              <button
                className={`node ${x.done ? "done" : ""}`}
                aria-pressed={x.done}
                aria-label={`Mark ${x.skill} ${x.done ? "not done" : "done"}`}
                onClick={() => toggle(x.skill)}
              >
                {x.done ? "✓" : i + 1}
              </button>
              <div>
                <h3>{x.skill}</h3>
                <p>
                  Level {x.cur} → {x.req} · about {x.weeks} week{x.weeks > 1 ? "s" : ""}
                </p>
                <div className="task">
                  <b>Practice:</b> {x.task[0]}
                </div>
                <div className="task">
                  <b>Project:</b> {x.task[1]}
                </div>
                <button
                  className="btn sm"
                  style={{ marginTop: 8 }}
                  onClick={() =>
                    navigate("/coach", {
                      state: { prompt: `Teach me ${x.skill} from zero. What should I learn first and how should I practise over ${x.weeks} week(s)?` },
                    })
                  }
                >
                  Ask coach how
                </button>
              </div>
              <div>
                <span className={`chip ${x.priority === "High" ? "bad" : x.priority === "Medium" ? "warn" : ""}`}>{x.priority}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty">No gaps for this role. Switch target role to build a new plan.</p>
        )}
      </section>
      <p className="note" style={{ marginTop: 12 }}>
        Marking a step done raises that skill to its target level and updates your readiness score. Undo restores the previous level.
      </p>
    </>
  );
}
