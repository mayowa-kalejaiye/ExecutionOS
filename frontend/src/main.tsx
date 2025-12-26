import { useState } from "react";
import { createRoot } from "react-dom/client";

import { signup, login, getCurrentUser, logout } from "./services/auth.ts";
import { createProject, listUserProjects } from "./services/projects.ts";
import type { Project } from "./services/projects.ts";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projectName, setProjectName] = useState("");
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignup() {
    setMessage(null);
    try {
      const user = await signup(email, password);
      setCurrentUser(user);
      console.log("signup ->", user);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message ?? String(err));
    }
  }

  async function handleLogin() {
    setMessage(null);
    try {
      const user = await login(email, password);
      setCurrentUser(user);
      console.log("login ->", user);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message ?? String(err));
    }
  }

  async function handleGetCurrentUser() {
    setMessage(null);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      console.log("currentUser ->", user);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message ?? String(err));
    }
  }

  async function handleCreateProject() {
    setMessage(null);
    try {
      const user = currentUser ?? (await getCurrentUser());
      if (!user) throw new Error("not authenticated");
      const project = await createProject(user.id, projectName);
      console.log("created project ->", project);
      setMessage(`Project created: ${project.data.name}`);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message ?? String(err));
    }
  }

  async function handleListProjects() {
    setMessage(null);
    try {
      const user = currentUser ?? (await getCurrentUser());
      if (!user) throw new Error("not authenticated");
      const list = await listUserProjects(user.id);
      setProjects(list.map((d) => d.data));
      console.log("projects ->", list);
    } catch (err: any) {
      console.error(err);
      setMessage(err?.message ?? String(err));
    }
  }

  async function handleLogout() {
    logout();
    setCurrentUser(null);
    setProjects(null);
    setMessage("logged out");
  }

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto", padding: 16 }}>
      <h2>ExecutionOS — Test Console</h2>

      <div style={{ marginBottom: 12 }}>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        <button onClick={handleSignup}>Signup</button>
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleGetCurrentUser}>Get Current User</button>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input placeholder="project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
        <button onClick={handleCreateProject}>Create Project</button>
        <button onClick={handleListProjects}>List My Projects</button>
      </div>

      <div>
        <strong>Current user:</strong> {currentUser ? JSON.stringify(currentUser) : "(none)"}
      </div>

      <div>
        <strong>Projects:</strong>
        <pre style={{ whiteSpace: "pre-wrap" }}>{projects ? JSON.stringify(projects, null, 2) : "(none)"}</pre>
      </div>

      {message && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          <strong>Error / Info:</strong> {message}
        </div>
      )}
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
