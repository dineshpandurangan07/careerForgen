import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LI_CHECKS, parseGh, parseLc, type Connect, type StudentState } from "@careerforge/shared";
import { PageHead } from "../components/PageHead";
import { useStore } from "../context/StoreContext";

type Draft = StudentState["connect"];

const clone = (c: Connect): Connect => JSON.parse(JSON.stringify(c));

export default function ConnectPage() {
  const { state, update, toast } = useStore();
  const navigate = useNavigate();
  const [d, setD] = useState<Draft>(() => clone(state.connect));
  const [err, setErr] = useState<Record<string, string>>({});

  const st = (ok: boolean) => <span className={`chip ${ok ? "ok" : ""}`}>{ok ? "Connected" : "Not connected"}</span>;

  function patch(path: string, value: unknown) {
    setD((prev) => {
      const next = clone(prev);
      const parts = path.split(".");
      let o: Record<string, unknown> = next as unknown as Record<string, unknown>;
      while (parts.length > 1) o = o[parts.shift()!] as Record<string, unknown>;
      o[parts[0]] = value;
      return next;
    });
  }

  const inp = (path: string, label: string, ph: string, type = "text") => {
    const get = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], d);
    return (
      <div className="fld">
        <label htmlFor={`c_${path}`}>{label}</label>
        <input
          id={`c_${path}`}
          type={type}
          min={type === "number" ? 0 : undefined}
          placeholder={ph}
          value={String(get ?? "")}
          autoComplete="off"
          onChange={(e) => patch(path, e.target.value)}
        />
        {err[path] && <div className="err" role="alert">{err[path]}</div>}
      </div>
    );
  };

  function save() {
    const c = clone(d);
    const e: Record<string, string> = {};
    c.email = c.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) e.email = "Enter a valid email address, like name@college.edu.";
    c.gh.user = parseGh(c.gh.user);
    c.lc.user = parseLc(c.lc.user);
    c.li.url = c.li.url.trim();
    if (c.li.url && !/^https?:/i.test(c.li.url)) c.li.url = `https://${c.li.url}`;
    if (c.gh.user && !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(c.gh.user)) e["gh.user"] = "Use letters, numbers and single hyphens, up to 39 characters.";
    if (c.lc.user && !/^[A-Za-z0-9_-]{3,30}$/.test(c.lc.user)) e["lc.user"] = "Use 3–30 letters, numbers, hyphens or underscores.";
    if (c.li.url && !/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]{3,100}\/?$/i.test(c.li.url)) e["li.url"] = "Use a link like https://www.linkedin.com/in/your-name.";
    if (Object.keys(e).length) {
      setErr(e);
      toast("Fix the highlighted fields");
      return;
    }
    (["repos", "commits", "stars"] as const).forEach((k) => (c.gh[k] = Math.max(0, Math.round(Number(c.gh[k]) || 0))));
    (["easy", "medium", "hard", "streak"] as const).forEach((k) => (c.lc[k] = Math.max(0, Math.round(Number(c.lc[k]) || 0))));
    c.gh.linked = !!c.gh.user;
    c.lc.linked = !!c.lc.user;
    c.li.linked = !!c.li.url;
    c.done = true;
    setErr({});
    update((s) => {
      s.connect = c;
    });
    toast("Saved. Reviewing your profiles…");
    navigate(state.targetSet ? "/guidance" : "/target");
  }

  function fillSample() {
    setD((prev) => {
      const c = clone(prev);
      if (!c.email) c.email = "arvind@college.edu";
      Object.assign(c.gh, { user: "arvind-demo", repos: 5, commits: 48, stars: 3, langs: "JavaScript, Python" });
      Object.assign(c.lc, { user: "arvind_demo", easy: 42, medium: 16, hard: 1, streak: 6 });
      c.li.url = "https://www.linkedin.com/in/arvind-demo";
      return c;
    });
    toast("Sample values filled. Review, then save.");
  }

  function clearAll() {
    setD((prev) => {
      const c: Draft = {
        done: prev.done,
        email: "",
        gh: { user: "", linked: false, repos: 0, stars: 0, commits: 0, langs: "" },
        lc: { user: "", linked: false, easy: 0, medium: 0, hard: 0, streak: 0 },
        li: { url: "", linked: false, checks: {} },
      };
      return c;
    });
    setErr({});
    toast("Connections cleared");
  }

  function skip() {
    update((s) => {
      s.connect.done = true;
    });
    navigate("/overview");
  }

  return (
    <>
      <PageHead
        title="Connect your profiles"
        sub={`${state.targetSet ? "" : "Step 1 of 2. "}Add your GitHub, LeetCode and LinkedIn. We review how they are performing and guide you from there. Skip any you don't have yet.`}
        role={false}
      />
      <section className="card" style={{ marginBottom: 18 }}>
        <h3>How data is read</h3>
        <p className="note" style={{ margin: "6px 0 0" }}>
          This build uses the numbers you type in from your profiles. Wire up the GitHub and LeetCode APIs to read them automatically. LinkedIn has no open profile API, so it uses your URL plus the checks you confirm.
        </p>
      </section>
      <div className="grid two">
        <section className="card">
          <div className="head-row">
            <h2>Email</h2>
            {st(!!(d.done && d.email))}
          </div>
          {inp("email", "College or personal email", "name@college.edu", "email")}
          <p className="note">Used for sign-in and job alerts.</p>
        </section>
        <section className="card">
          <div className="head-row">
            <h2>LinkedIn</h2>
            {st(d.li.linked || !!d.li.url)}
          </div>
          {inp("li.url", "Profile URL", "https://www.linkedin.com/in/your-name", "url")}
          <p className="note" style={{ margin: "0 0 4px" }}>
            <b>Tick what your profile already has</b> (open your profile and check honestly):
          </p>
          {LI_CHECKS.map(([k, t]) => (
            <label className="chk" key={k}>
              <input type="checkbox" checked={!!d.li.checks[k]} onChange={(e) => patch(`li.checks.${k}`, e.target.checked)} /> {t}
            </label>
          ))}
          <p className="note">Nothing is fetched from LinkedIn.</p>
        </section>
        <section className="card">
          <div className="head-row">
            <h2>GitHub</h2>
            {st(d.gh.linked || !!d.gh.user)}
          </div>
          {inp("gh.user", "GitHub link or username", "https://github.com/your-name")}
          <div className="cgrid">
            {inp("gh.repos", "Public repos", "0", "number")}
            {inp("gh.commits", "Commits, last 90 days", "0", "number")}
            {inp("gh.stars", "Stars earned", "0", "number")}
            {inp("gh.langs", "Top languages", "JavaScript, Python")}
          </div>
        </section>
        <section className="card">
          <div className="head-row">
            <h2>LeetCode</h2>
            {st(d.lc.linked || !!d.lc.user)}
          </div>
          {inp("lc.user", "LeetCode link or username", "https://leetcode.com/u/your-name")}
          <div className="cgrid">
            {inp("lc.easy", "Easy solved", "0", "number")}
            {inp("lc.medium", "Medium solved", "0", "number")}
            {inp("lc.hard", "Hard solved", "0", "number")}
            {inp("lc.streak", "Current streak (days)", "0", "number")}
          </div>
        </section>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button className="btn primary" onClick={save}>
          Save and get my guidance
        </button>
        <button className="btn" onClick={fillSample}>
          Fill sample profile
        </button>
        <button className="btn" onClick={clearAll}>
          Clear connections
        </button>
        <button className="btn" onClick={skip}>
          Skip for now
        </button>
      </div>
    </>
  );
}
