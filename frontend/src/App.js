import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import ProblemsPage from "@/pages/ProblemsPage";
import ProblemSolvePage from "@/pages/ProblemSolvePage";
import ContestListPage from "@/pages/ContestListPage";
import ContestArenaPage from "@/pages/ContestArenaPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ProfilePage from "@/pages/ProfilePage";
import DailyChallengePage from "@/pages/DailyChallengePage";
import RoadmapPage from "@/pages/RoadmapPage";
import GlobalLeaderboardPage from "@/pages/GlobalLeaderboardPage";
import InterviewKitsPage from "@/pages/InterviewKitsPage";
import BattleModePage from "@/pages/BattleModePage";
import "@/App.css";

// Protected route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-mono">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout><LandingPage /></AppLayout>} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/problems"
        element={<AppLayout><ProblemsPage /></AppLayout>}
      />
      <Route
        path="/problems/:problemId"
        element={
          <ProtectedRoute>
            <AppLayout><ProblemSolvePage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contests"
        element={<AppLayout><ContestListPage /></AppLayout>}
      />
      <Route
        path="/contests/:contestId"
        element={
          <ProtectedRoute>
            <AppLayout><ContestArenaPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout><ProfilePage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AppLayout><AdminDashboard /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#121215',
              border: '1px solid #27272a',
              color: '#fafafa',
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
