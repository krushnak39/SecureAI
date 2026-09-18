import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

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

function Home() {
  return <div className="p-10 text-white">SecureAI Home</div>;
}

function Login() {
  return <div className="p-10 text-white">SecureAI Login</div>;
}

function Register() {
  return <div className="p-10 text-white">SecureAI Register</div>;
}

function Projects() {
  return <div className="p-10 text-white">Projects</div>;
}

function ProjectDetails() {
  return <div className="p-10 text-white">Project Details</div>;
}

function Settings() {
  return <div className="p-10 text-white">Settings</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

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

          <Route path="/projects" element={<Projects />} />

          <Route
            path="/projects/:id"
            element={<ProjectDetails />}
          />

          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;