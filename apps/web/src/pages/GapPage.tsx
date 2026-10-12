import { gapStatus, gaps } from "@careerforge/shared";
import { PageHead } from "../components/PageHead";
import { useStore } from "../context/StoreContext";

export default function GapPage() {
  const { state, update } = useStore();
  const g = gaps(state);
  const ready = g.filter((x) => x.gap === 0).length;
  const notStarted = g.every((x) => x.cur === 0);

  return (
    <>
      <PageHead
        title="Skill gap"
        sub={`${ready} of ${g.length} required skills are at target level. Click the boxes to update what you can do.${notStarted ? " Not started yet? Leave everything at zero and open the Roadmap." : ""}`}
        role={false}
      />
      <section className="card">
        <div className="legend">
          <span>Filled = your level (1–5)</span>
          <span>
            <span style={{ color: "var(--ember)" }}>●</span> Orange marker = level this role needs
          </span>
        </div>
        {g.map((x) => {
          const [st, cl] = gapStatus(x);
          return (
            <div className="row" key={x.skill}>
              <div>
                <b>{x.skill}</b>
                <div className="note">{x.gap ? `Needs +${x.gap}` : "At target"}</div>
              </div>
              <div className="dots" role="group" aria-label={`${x.skill} level`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`dot ${n <= x.cur ? "on" : ""} ${n === x.req ? "req" : ""}`}
                    aria-label={`Set ${x.skill} to level ${n}`}
                    aria-pressed={n <= x.cur}
                    onClick={() =>
                      update((s) => {
                        s.levels[x.skill] = n === x.cur ? n - 1 : n;
                      })
                    }
                  />
                ))}
              </div>
              <div>
                <span className={`chip ${cl}`}>{st}</span>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
