import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard/Dashboard";

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
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;