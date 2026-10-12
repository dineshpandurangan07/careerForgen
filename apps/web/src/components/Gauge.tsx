import { heat, levelCls, levelOf, pct } from "@careerforge/shared";

export function Gauge({ value, caption }: { value: number; caption: string }) {
  const p = pct(value);
  return (
    <section className="card gauge" aria-label="Career readiness score">
      <svg viewBox="0 0 220 125" role="img" aria-label={`Readiness ${p} percent`}>
        <defs>
          <linearGradient id="hg" gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="200" y2="0">
            <stop offset="0" stopColor="hsl(212 72% 46%)" />
            <stop offset=".5" stopColor="hsl(110 60% 42%)" />
            <stop offset="1" stopColor="hsl(20 82% 50%)" />
          </linearGradient>
        </defs>
        <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="var(--soft)" strokeWidth="16" strokeLinecap="round" />
        <path
          className="arc-fg"
          d="M20 110 A90 90 0 0 1 200 110"
          fill="none"
          stroke="url(#hg)"
          strokeWidth="16"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - value * 100}
        />
      </svg>
      <div className="num" style={{ color: heat(value) }}>
        {p}%
      </div>
      <div>
        <span className={`chip ${levelCls(value)}`}>{levelOf(value)} level</span>
      </div>
      <div className="cap">{caption}</div>
    </section>
  );
}
