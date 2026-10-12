import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { blank, type Job, type StudentState } from "@careerforge/shared";
import { api } from "../api/client";

interface StoreContextValue {
  state: StudentState;
  jobs: Job[];
  loading: boolean;
  aiEnabled: boolean;
  update: (fn: (s: StudentState) => void) => void;
  setState: (s: StudentState) => void;
  saveNow: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
  loadSample: () => Promise<void>;
  toast: (message: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const clone = <T,>(v: T): T =>
  typeof structuredClone === "function" ? structuredClone(v) : (JSON.parse(JSON.stringify(v)) as T);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<StudentState>(() => blank(""));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const timer = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(""), 2400);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const toast = useCallback((message: string) => setToastMsg(message), []);

  const refresh = useCallback(async () => {
    const [profile, jobsRes, status] = await Promise.all([
      api.getProfile(),
      api.listJobs({ limit: 50 }).catch(() => ({ jobs: [] as Job[], total: 0, page: 1, pages: 1 })),
      api.aiStatus().catch(() => ({ enabled: false })),
    ]);
    setStateRaw(profile.state);
    setJobs(jobsRes.jobs);
    setAiEnabled(status.enabled);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const persist = useCallback(async () => {
    try {
      await api.putProfile(stateRef.current);
    } catch {
      /* offline edit; will retry on next change */
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persist(), 500);
  }, [persist]);

  const update = useCallback(
    (fn: (s: StudentState) => void) => {
      setStateRaw((prev) => {
        const next = clone(prev);
        fn(next);
        return next;
      });
      scheduleSave();
    },
    [scheduleSave],
  );

  const setState = useCallback((s: StudentState) => setStateRaw(s), []);

  const saveNow = useCallback(async () => {
    if (timer.current) window.clearTimeout(timer.current);
    await persist();
  }, [persist]);

  const reset = useCallback(async () => {
    const res = await api.resetProfile();
    setStateRaw(res.state);
  }, []);

  const loadSample = useCallback(async () => {
    const res = await api.sampleProfile();
    setStateRaw(res.state);
    toast("Sample profile loaded");
  }, [toast]);

  return (
    <StoreContext.Provider
      value={{ state, jobs, loading, aiEnabled, update, setState, saveNow, refresh, reset, loadSample, toast }}
    >
      {children}
      <div className={`toast ${toastMsg ? "show" : ""}`} role="status" aria-live="polite">
        {toastMsg}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
