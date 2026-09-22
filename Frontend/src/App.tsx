import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import ProjectDetails from "./pages/Projects/ProjectDetails";
import Settings from "./pages/Settings/Settings";

import Architecture from "./pages/Architecture/Architecture";
import CICD from "./pages/CICD/CICD";
import CodebaseChat from "./pages/CodebaseChat/CodebaseChat";
import CodeReview from "./pages/CodeReview/CodeReview";
import Dependencies from "./pages/Dependencies/Dependencies";
import Documentation from "./pages/Documentation/Documentation";
import Performance from "./pages/Performance/Performance";
import Security from "./pages/Security/Security";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Global workspace */}
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              {/* Project management */}
              <Route
                path="/projects"
                element={<Projects />}
              />

              {/* Project workspace */}
              <Route
                path="/projects/:id"
                element={<ProjectDetails />}
              />

              {/* Project-aware intelligence modules */}
              <Route
                path="/projects/:id/review"
                element={<CodeReview />}
              />

              <Route
                path="/projects/:id/security"
                element={<Security />}
              />

              <Route
                path="/projects/:id/dependencies"
                element={<Dependencies />}
              />

              <Route
                path="/projects/:id/architecture"
                element={<Architecture />}
              />

              <Route
                path="/projects/:id/performance"
                element={<Performance />}
              />

              <Route
                path="/projects/:id/chat"
                element={<CodebaseChat />}
              />

              <Route
                path="/projects/:id/documentation"
                element={<Documentation />}
              />

              <Route
                path="/projects/:id/cicd"
                element={<CICD />}
              />

              {/* System */}
              <Route
                path="/settings"
                element={<Settings />}
              />
            </Route>
          </Route>

          {/* Unknown route */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;