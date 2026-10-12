import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { levelOf, overall, type ChatMessage } from "@careerforge/shared";
import { api, aiStream } from "../api/client";
import { PageHead } from "../components/PageHead";
import { useStore } from "../context/StoreContext";
import { md } from "../lib/md";

export default function CoachPage() {
  const { state, aiEnabled } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<ChatMessage[]>(() => state.chat);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  const sentPrompt = useRef(false);

  const L = levelOf(overall(state));

  const chips = (
    L === "Beginner"
      ? ["I'm a beginner. Where do I start?", "Which career suits me?", "How do I learn coding step by step?", "What should I build first?"]
      : ["What should I fix first to get hired?", "How do I prepare for interviews?", "How can I improve my resume?", "Which jobs should I apply to first?"]
  ).concat(["Explain my readiness score"]);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function send(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: q.slice(0, 1500) }, { role: "assistant", content: "" }]);
    setBusy(true);
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    try {
      const full = await aiStream.coach(q, {
        signal: ctrl.signal,
        onDelta: (t) =>
          setMsgs((m) => {
            const c = [...m];
            c[c.length - 1] = { role: "assistant", content: t };
            return c;
          }),
      });
      setMsgs((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", content: full || "(No answer.)" };
        return c;
      });
    } catch {
      if (!ctrl.signal.aborted) {
        setMsgs((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", content: "The coach couldn't answer just now. Please try again." };
          return c;
        });
      }
    } finally {
      setBusy(false);
      ctrlRef.current = null;
    }
  }

  useEffect(() => {
    if (sentPrompt.current) return;
    const p = (location.state as { prompt?: string } | null)?.prompt;
    if (p) {
      sentPrompt.current = true;
      navigate(location.pathname, { replace: true });
      void send(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  }

  async function clear() {
    if (busy) return;
    await api.clearChat().catch(() => undefined);
    setMsgs([]);
  }

  return (
    <>
      <PageHead title="Career coach" sub="Ask any career doubt. Answers use your scores, skills and connected accounts." role={false} />
      <section className="card chat">
        <div className="note">
          {aiEnabled
            ? "Answers come from the AI coach, personalised with your profile. Advice is guidance only and can be wrong."
            : "The AI coach isn't configured, so built-in guides answer common questions."}
        </div>
        <div className="msgs" ref={msgsRef} aria-live="polite">
          {msgs.length ? (
            msgs.map((m, i) => (
              <div className={`msg ${m.role}`} key={i}>
                {m.role === "user" ? (
                  <div className="b">{m.content}</div>
                ) : m.content ? (
                  <div className="b" dangerouslySetInnerHTML={{ __html: md(m.content) }} />
                ) : (
                  <div className="b thinking">Thinking…</div>
                )}
              </div>
            ))
          ) : (
            <div className="msg assistant">
              <div className="b">
                <p>Hi, I'm your career coach. Ask me anything about careers, skills, projects, coding practice, resumes or interviews.</p>
                <p>
                  {L === "Beginner" ? "You're at the beginner stage, so a good first question is where do I start?" : "I can see your scores and gaps, so my answers are based on your profile."}{" "}
                  You can write in English, Tamil, Hindi or another language.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="chips">
          {chips.map((c) => (
            <button className="btn" key={c} onClick={() => void send(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="composer">
          <textarea
            rows={2}
            maxLength={1500}
            placeholder="Type your doubt. Enter to send, Shift+Enter for a new line."
            aria-label="Ask the career coach"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
          />
          <button className="btn primary" hidden={busy} onClick={() => void send(input)}>
            Send
          </button>
          <button className="btn" hidden={!busy} onClick={() => ctrlRef.current?.abort()}>
            Stop
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span className="note">Advice is guidance only and can be wrong. It doesn't guarantee any job outcome.</span>
          {msgs.length > 0 && (
            <button className="btn sm" onClick={() => void clear()}>
              Clear chat
            </button>
          )}
        </div>
      </section>
    </>
  );
}
