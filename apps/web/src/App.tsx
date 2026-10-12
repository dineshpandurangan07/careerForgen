import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { BottomNav, MoreSheet, MobileTop, Sidebar, useSheet } from "./components/Chrome";
import { useAuth } from "./context/AuthContext";
import { StoreProvider, useStore } from "./context/StoreContext";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import ConnectPage from "./pages/ConnectPage";
import TargetPage from "./pages/TargetPage";
import GapPage from "./pages/GapPage";
import RoadmapPage from "./pages/RoadmapPage";
import GuidancePage from "./pages/GuidancePage";
import CoachPage from "./pages/CoachPage";
import JobsPage from "./pages/JobsPage";
import AnalysisPage from "./pages/AnalysisPage";
import ProfilePage from "./pages/ProfilePage";

function Splash() {
  return (
    <div className="auth">
      <div className="scene">
        <div className="stage">
          <div className="floor" aria-hidden="true" />
          <div className="cardwrap">
            <div className="card3d">
              <div className="tile" aria-hidden="true" />
              <h1 className="wt">Just a moment…</h1>
              <p className="ws">Restoring your session</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StartRedirect() {
  const { state, loading } = useStore();
  if (loading) return null;
  const linked = state.connect.gh || state.connect.lc || state.connect.li;
  return <Navigate to={linked ? "/overview" : "/connect"} replace />;
}

function AppLayout() {
  const { loading } = useStore();
  const { open, setOpen } = useSheet();
  if (loading) return <Splash />;
  return (
    <>
      <div className="app">
        <Sidebar />
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      <MobileTop />
      <BottomNav onMore={() => setOpen(true)} />
      <MoreSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function AuthedApp() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<StartRedirect />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="connect" element={<ConnectPage />} />
          <Route path="target" element={<TargetPage />} />
          <Route path="gap" element={<GapPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="guidance" element={<GuidancePage />} />
          <Route path="coach" element={<CoachPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreProvider>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  useEffect(() => {
    document.body.classList.toggle("authed", !!user);
    return () => document.body.classList.remove("authed");
  }, [user]);
  if (loading) return <Splash />;
  if (!user) return <LoginPage />;
  return <AuthedApp />;
}
