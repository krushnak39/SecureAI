import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

import DashboardLayout from "./components/layout/DashboardLayout";

import Architecture from "./pages/Architecture/Architecture";
import CICD from "./pages/CICD/CICD";
import CodebaseChat from "./pages/CodebaseChat/CodebaseChat";
import CodeReview from "./pages/CodeReview/CodeReview";
import Dashboard from "./pages/Dashboard/Dashboard";
import Dependencies from "./pages/Dependencies/Dependencies";
import Documentation from "./pages/Documentation/Documentation";
import Performance from "./pages/Performance/Performance";
import Security from "./pages/Security/Security";

import Projects from "./pages/Projects/Projects";

import ProjectDetails from "./pages/Projects/ProjectDetails";
import Settings from "./pages/Settings/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard / Application */}
        <Route element={<DashboardLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/dashboard/review"
            element={<CodeReview />}
          />

          <Route
            path="/dashboard/security"
            element={<Security />}
          />

          <Route
            path="/dashboard/dependencies"
            element={<Dependencies />}
          />

          <Route
            path="/dashboard/architecture"
            element={<Architecture />}
          />

          <Route
            path="/dashboard/performance"
            element={<Performance />}
          />

          <Route
            path="/dashboard/chat"
            element={<CodebaseChat />}
          />

          <Route
            path="/dashboard/documentation"
            element={<Documentation />}
          />

          <Route
            path="/dashboard/cicd"
            element={<CICD />}
          />

          {/* Project Management */}
          <Route
            path="/projects"
            element={<Projects />}
          />

          <Route
            path="/projects/:id"
            element={<ProjectDetails />}
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;