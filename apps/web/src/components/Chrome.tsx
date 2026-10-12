import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { roadmap } from "@careerforge/shared";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const initials = (n: string) =>
  (n || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();

function useCounts() {
  const { state } = useStore();
  const rm = roadmap(state).filter((r) => !r.done).length;
  const apps = Object.values(state.applied).filter((a) => a !== "Withdrawn").length;
  return { rm, apps };
}

function Account() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="acct" id="acct">
      <span className="av" aria-hidden="true">
        {initials(user.name)}
      </span>
      <span className="who">
        <b>{user.name}</b>
        <span className="note">{user.email}</span>
      </span>
      <button className="btn sm" onClick={() => void logout()}>
        Sign out
      </button>
    </div>
  );
}

interface NavItem {
  view: string;
  label: string;
  badge?: number;
}

function useNavItems(): NavItem[] {
  const { rm, apps } = useCounts();
  return useMemo(
    () => [
      { view: "target", label: "Target role" },
      { view: "connect", label: "Connect accounts" },
      { view: "overview", label: "Overview" },
      { view: "coach", label: "Career coach" },
      { view: "gap", label: "Skill gap" },
      { view: "roadmap", label: "Roadmap", badge: rm },
      { view: "guidance", label: "Career guidance" },
      { view: "analysis", label: "Job analysis" },
      { view: "jobs", label: "Jobs", badge: apps },
      { view: "profile", label: "Profile & scoring" },
    ],
    [rm, apps],
  );
}

const SHEET_VIEWS = ["target", "connect", "gap", "guidance", "analysis", "profile"];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const items = useNavItems();
  const active = location.pathname.slice(1) || "overview";
  return (
    <nav className="side" aria-label="Main">
      <div className="brand">
        <i />
        CareerForge
      </div>
      {items.map((it) => (
        <button
          key={it.view}
          className="nav-btn"
          aria-current={active === it.view ? "page" : undefined}
          onClick={() => navigate(`/${it.view}`)}
        >
          {it.label}
          {it.badge ? <span className="badge">{it.badge}</span> : null}
        </button>
      ))}
      <Account />
      <div className="side-foot">
        Jobs and salaries shown are demo data. Scores are estimates, not predictions of hiring outcomes.
      </div>
    </nav>
  );
}

export function MobileTop() {
  const { user } = useAuth();
  return (
    <header className="mtop">
      <span className="brand">
        <i />
        CareerForge
      </span>
      <span className="av" aria-hidden="true">
        {initials(user?.name || "")}
      </span>
    </header>
  );
}

const ICONS: Record<string, JSX.Element> = {
  overview: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </>
  ),
  coach: <path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z" />,
  roadmap: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H14a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8" />
    </>
  ),
  jobs: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
};

export function BottomNav({ onMore }: { onMore: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.slice(1) || "overview";
  const items: { view: string; label: string }[] = [
    { view: "overview", label: "Home" },
    { view: "coach", label: "Coach" },
    { view: "roadmap", label: "Roadmap" },
    { view: "jobs", label: "Jobs" },
  ];
  const moreActive = SHEET_VIEWS.includes(active);
  return (
    <nav className="bottom" aria-label="Primary">
      {items.map((it) => (
        <button key={it.view} aria-current={active === it.view ? "page" : undefined} onClick={() => navigate(`/${it.view}`)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[it.view]}
          </svg>
          <span>{it.label}</span>
        </button>
      ))}
      <button aria-haspopup="dialog" aria-current={moreActive ? "page" : undefined} onClick={onMore}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {ICONS.more}
        </svg>
        <span>More</span>
      </button>
    </nav>
  );
}

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet" hidden={!open}>
      <div className="sheet-bg" onClick={onClose} />
      <div className="sheet-body" role="dialog" aria-modal="true" aria-label="More pages">
        <Account />
        {[
          ["target", "Target role"],
          ["connect", "Connect accounts"],
          ["gap", "Skill gap"],
          ["guidance", "Career guidance"],
          ["analysis", "Job analysis"],
          ["profile", "Profile & scoring"],
        ].map(([view, label]) => (
          <button
            key={view}
            className="nav-btn"
            onClick={() => {
              navigate(`/${view}`);
              onClose();
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function useSheet() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
