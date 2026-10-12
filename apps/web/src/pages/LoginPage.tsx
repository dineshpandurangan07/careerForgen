import { useEffect, useRef, useState, type FormEvent, type ReactNode, type SVGProps } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Mode = "signin" | "signup" | "forgot" | "reset" | "google";

const Cloud = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 170 90" xmlns="http://www.w3.org/2000/svg" role="presentation" {...p}>
    <defs>
      <linearGradient id="gCl" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" />
        <stop offset="1" stopColor="#EDE6FF" />
      </linearGradient>
    </defs>
    <g fill="url(#gCl)">
      <circle cx="52" cy="52" r="26" />
      <circle cx="86" cy="38" r="32" />
      <circle cx="120" cy="52" r="26" />
      <rect x="40" y="50" width="94" height="28" rx="14" />
    </g>
  </svg>
);

const Plant = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 130 220" xmlns="http://www.w3.org/2000/svg" role="presentation" {...p}>
    <defs>
      <linearGradient id="gLeaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8EE3B0" />
        <stop offset="1" stopColor="#3FAE7C" />
      </linearGradient>
      <linearGradient id="gPot" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#E0D6FF" />
        <stop offset="1" stopColor="#A994F0" />
      </linearGradient>
    </defs>
    <g fill="url(#gLeaf)">
      <ellipse cx="65" cy="80" rx="15" ry="64" transform="rotate(-4 65 150)" />
      <ellipse cx="38" cy="104" rx="14" ry="52" transform="rotate(-30 65 150)" />
      <ellipse cx="94" cy="104" rx="14" ry="52" transform="rotate(30 65 150)" />
      <ellipse cx="22" cy="132" rx="11" ry="38" transform="rotate(-56 65 150)" />
      <ellipse cx="108" cy="132" rx="11" ry="38" transform="rotate(56 65 150)" />
    </g>
    <path d="M30 150h70l-8 58c-1 6-6 10-12 10H50c-6 0-11-4-12-10Z" fill="url(#gPot)" />
    <rect x="24" y="142" width="82" height="16" rx="8" fill="#CBBBFF" />
  </svg>
);

const Lamp = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 140 170" xmlns="http://www.w3.org/2000/svg" role="presentation" {...p}>
    <defs>
      <linearGradient id="gLamp" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#B9A7FF" />
        <stop offset="1" stopColor="#7358E6" />
      </linearGradient>
    </defs>
    <path d="M70 0v70" stroke="#8C74E8" strokeWidth="4" />
    <path d="M18 124C18 88 42 66 70 66s52 22 52 58Z" fill="url(#gLamp)" />
    <rect x="14" y="120" width="112" height="12" rx="6" fill="#6F55DE" />
    <ellipse cx="70" cy="140" rx="30" ry="9" fill="#FFE9A8" />
  </svg>
);

const Shelf = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 170 190" xmlns="http://www.w3.org/2000/svg" role="presentation" {...p}>
    <rect x="10" y="70" width="150" height="12" rx="6" fill="#CDBFFF" />
    <rect x="10" y="168" width="150" height="12" rx="6" fill="#CDBFFF" />
    <rect x="22" y="22" width="16" height="48" rx="4" fill="#7FD8D0" />
    <rect x="40" y="12" width="16" height="58" rx="4" fill="#B7A4FF" />
    <rect x="58" y="28" width="16" height="42" rx="4" fill="#FFB3C7" />
    <rect x="76" y="18" width="14" height="52" rx="4" fill="#FFD27A" transform="rotate(8 83 70)" />
    <rect x="104" y="120" width="40" height="48" rx="12" fill="#FFB3C7" />
    <circle cx="114" cy="112" r="9" fill="#FFB3C7" />
    <circle cx="134" cy="112" r="9" fill="#FFB3C7" />
    <circle cx="116" cy="140" r="2.6" fill="#4A3A5C" />
    <circle cx="132" cy="140" r="2.6" fill="#4A3A5C" />
    <path d="M121 146q3 3 6 0" stroke="#4A3A5C" strokeWidth="2" fill="none" />
  </svg>
);

const Cap = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation" {...p}>
    <path d="M32 12 6 25l26 13 26-13Z" fill="#fff" />
    <path d="M16 33v10c0 4 7 9 16 9s16-5 16-9V33l-16 8Z" fill="#fff" opacity=".9" />
    <path d="M56 27v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <circle cx="56" cy="46" r="3" fill="#FFD76A" />
  </svg>
);

const Star = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="presentation" {...p}>
    <path d="M12 1.5l3 7 7.5.6-5.7 4.9 1.8 7.3L12 17.3 5.4 21.3l1.8-7.3L1.5 9.1 9 8.5z" fill="#FFD76A" stroke="#F4B93A" strokeWidth="1" strokeLinejoin="round" />
  </svg>
);

const GoogleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" role="presentation" {...p}>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z" />
  </svg>
);

const AIIcon = ({ children }: { children: ReactNode }) => (
  <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

function Scene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    if (reduce || coarse) return;
    let raf = 0;
    const onMove = (ev: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const sc = ref.current;
        if (!sc) return;
        sc.style.setProperty("--nx", ((ev.clientX / window.innerWidth - 0.5) * 2).toFixed(3));
        sc.style.setProperty("--ny", ((ev.clientY / window.innerHeight - 0.5) * 2).toFixed(3));
      });
    };
    document.addEventListener("pointermove", onMove);
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="auth">
      <div className="scene" ref={ref}>
        <div className="stage">
          <div className="floor" aria-hidden="true" />
          <div className="deco cloud c1" aria-hidden="true"><Cloud /></div>
          <div className="deco cloud c2" aria-hidden="true"><Cloud /></div>
          <div className="deco lamp" aria-hidden="true"><Lamp /></div>
          <div className="deco shelf" aria-hidden="true"><Shelf /></div>
          <div className="deco plant p1" aria-hidden="true"><Plant /></div>
          <div className="deco plant p2" aria-hidden="true"><Plant /></div>
          <div className="girl" aria-hidden="true">
            <img src="/girl.webp" alt="" />
          </div>
          <div className="cardwrap">{children}</div>
        </div>
      </div>
    </div>
  );
}

const Field = ({
  id, label, type, value, onChange, placeholder, icon, error, autoComplete, onToggle,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: ReactNode;
  error?: string;
  autoComplete?: string;
  onToggle?: (show: boolean) => void;
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="af">
      <label className="sr" htmlFor={id}>{label}</label>
      {icon}
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {onToggle && (
        <button
          type="button"
          className="eye"
          aria-pressed={pressed}
          aria-label="Show password"
          onClick={() => {
            const next = !pressed;
            setPressed(next);
            onToggle(next);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            <path className="slash" d="M4 4l16 16" />
          </svg>
        </button>
      )}
      {error && <div className="err" role="alert">{error}</div>}
    </div>
  );
};

export default function LoginPage() {
  const { login, register } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const g = params.get("google");
    if (g === "link_required") setErr({ form: "This email already has a password. Log in with your password instead." });
    else if (g === "ok") setErr({});
  }, [params]);

  const titles: Record<Mode, [string, string]> = {
    signin: ["Welcome Back!", "Please login to continue"],
    signup: ["Create Account", "Start your career journey"],
    forgot: ["Reset Password", "We'll help you set a new one"],
    reset: ["Choose a new password", "Enter the link token and a new password"],
    google: ["Continue with Google", "Secure sign-in"],
  };
  const [t1, t2] = titles[mode];

  const validatePw = (v: string) => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const e2: Record<string, string> = {};
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) e2.a_email = "Enter a valid email address, like name@college.edu.";
    if (mode === "signin" && !pw) e2.a_pw = "Enter your password.";
    if (mode === "signup") {
      if (name.trim().length < 2 || name.trim().length > 60) e2.a_name = "Enter your name, 2 to 60 characters.";
      if (!validatePw(pw)) e2.a_pw = "Use at least 8 characters with a letter and a number.";
      else if (pw !== pw2) e2.a_pw2 = "The passwords don't match.";
    }
    if (mode === "reset") {
      if (!validatePw(pw)) e2.a_pw = "Use at least 8 characters with a letter and a number.";
      else if (pw !== pw2) e2.a_pw2 = "The passwords don't match.";
    }
    setErr(e2);
    if (Object.keys(e2).length) return;
    setBusy(true);
    try {
      if (mode === "signin") await login(em, pw);
      else if (mode === "signup") await register(name.trim(), em, pw);
      else if (mode === "forgot") {
        const res = await api.forgot(em);
        setErr({ form: res.devToken ? `Dev reset token: ${res.devToken}` : res.message });
        if (res.devToken) {
          setPw("");
          setPw2("");
          setMode("reset");
          setErr({ form: `Dev mode: a reset token was generated. Paste it below. (${res.devToken})` });
        }
      }
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Something went wrong. Try again.";
      setErr({ form: msg });
    } finally {
      setBusy(false);
    }
  }

  const goText = busy ? "Please wait…" : { signin: "Login", signup: "Create account", forgot: "Send reset link", reset: "Reset password", google: "Continue" }[mode];

  const foot =
    mode === "signin" ? (
      <>Don't have an account? <button type="button" className="linkbtn" onClick={() => { setMode("signup"); setErr({}); }}>Sign Up</button></>
    ) : (
      <button type="button" className="linkbtn" onClick={() => { setMode("signin"); setErr({}); }}>Back to login</button>
    );

  return (
    <Scene>
      <div className="card3d">
        <div className="tile" aria-hidden="true">
          <Cap />
          <span className="star"><Star /></span>
        </div>
        <h1 className="wt">{t1}</h1>
        <p className="ws">{t2}</p>
        <form onSubmit={submit} noValidate>
          {err.form && <div className="formerr" role="alert">{err.form}</div>}
          {mode === "signup" && (
            <Field id="a_name" label="Full name" type="text" value={name} onChange={setName} placeholder="Full name" autoComplete="name"
              icon={<AIIcon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></AIIcon>} error={err.a_name} />
          )}
          <Field id="a_email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="Email address" autoComplete="email"
            icon={<AIIcon><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 8l9 6 9-6" /></AIIcon>} error={err.a_email} />
          {mode !== "forgot" && (
            <Field id="a_pw" label="Password" type={showPw ? "text" : "password"} value={pw} onChange={setPw} placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              icon={<AIIcon><rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></AIIcon>}
              error={err.a_pw} onToggle={setShowPw} />
          )}
          {(mode === "signup" || mode === "reset") && (
            <Field id="a_pw2" label="Confirm password" type={showPw ? "text" : "password"} value={pw2} onChange={setPw2} placeholder="Confirm password" autoComplete="new-password"
              icon={<AIIcon><rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></AIIcon>} error={err.a_pw2} />
          )}
          {mode === "reset" && (
            <p className="hint">Enter the reset token from your email (or the dev token shown after requesting).</p>
          )}
          {mode === "forgot" && (
            <p className="hint">We'll generate a reset link. In this dev build the token is shown after you submit.</p>
          )}
          {mode === "signin" && (
            <div className="forgot">
              <button type="button" className="linkbtn" onClick={() => { setMode("forgot"); setErr({}); }}>Forgot Password?</button>
            </div>
          )}
          <button className="go" type="submit" disabled={busy}>{goText}</button>
        </form>
        {(mode === "signin" || mode === "signup") && (
          <>
            <div className="or"><span>or continue with</span></div>
            <button type="button" className="gbtn" onClick={() => { window.location.href = "/api/auth/google"; }}>
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </>
        )}
        <p className="foot">{foot}</p>
        <p className="pnote">
          Your account and progress are stored on the server. Scores are estimates, not predictions of hiring outcomes.
        </p>
      </div>
    </Scene>
  );
}
