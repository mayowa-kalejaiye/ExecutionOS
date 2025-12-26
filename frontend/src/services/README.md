# ExecutionOS — Backend Services (Frontend Integration Guide)

This document describes the TypeScript service modules that implement backend logic using the CocoBase SDK. Frontend engineers should call these service functions from React components or hooks. All writes are explicit and must be triggered by user actions (buttons, forms, etc.).

Location
- Service implementations: `src/services/*.ts`
- CocoBase client: `src/lib/cocobase.ts` (requires `VITE_COCOBASE_API_KEY`)

Core constraints
- Backend uses only the CocoBase SDK via `src/lib/cocobase.ts`.
- No schema changes or additional backend frameworks.
- All side-effecting operations are explicit and user-triggered.
- Activity logs are written by services (not by UI components).

Available services and primary exports

1) Auth service — `src/services/auth.ts`
- signup(email: string, password: string, data?: Record<string, any>) => Promise<AppUser>
- login(email: string, password: string) => Promise<AppUser>
- getCurrentUser() => Promise<AppUser | null>
- logout() => void
- onAuthEvent(callbacks) => void
- isAuthenticated() => boolean

Behavior notes
- `signup` and `login` call `cocobase.auth.register` / `cocobase.auth.login`. They return the authenticated user object.
- `getCurrentUser` returns null if unauthenticated.

2) Projects service — `src/services/projects.ts`
- createProject(ownerId: string, name: string) => Promise<Document<Project>>
- listUserProjects(userId: string) => Promise<Document<Project>[]>
- addUserToProject(projectId: string, userId: string, actorId: string) => Promise<Document<ProjectMember>>

Behavior notes
- `createProject` creates a `projects` document, creates a `project_members` entry for the owner, and writes an `activity_logs` entry. Caller must pass the `ownerId` (authenticated user's id).
- `listUserProjects` lists projects by looking up `project_members` for the given user and then fetching each `projects` document.
- `addUserToProject` enforces that `actorId` is already a project member and prevents duplicate membership.

3) Tasks service — `src/services/tasks.ts`
- createTask(actorId, projectId, title, description?, assigneeId?, dueDate?) => Promise<Document<Task>>
- assignTask(actorId, taskId, assigneeId) => Promise<Document<Task>>
- updateTaskStatus(actorId, taskId, status) => Promise<Document<Task>>
- listProjectTasks(projectId) => Promise<Document<Task>[]>

Behavior notes
- All operations enforce project membership for the performing `actorId` (and for `assigneeId` when applicable).
- Each write also creates an `activity_logs` document describing the action.

4) Activity service — `src/services/activity.ts`
- listActivityLogs(projectId, limit = 100) => Promise<Document<ActivityLog>[]> (read-only)
- subscribeActivityLogs(projectId, handlers) => () => void  (returns unsubscribe)

Realtime
- Use `subscribeActivityLogs` to receive realtime events for `activity_logs`. The function returns an unsubscribe function which must be called on unmount.
- Example handler signature: `onCreate: (doc) => { /* doc is Cocobase Document<ActivityLog> */ }`.

Types
- Services return CocoBase `Document<T>` objects from the SDK. You can import types from the SDK if you need to access `Document<T>` shape.

Environment
- `src/lib/cocobase.ts` reads `import.meta.env.VITE_COCOBASE_API_KEY`. Ensure the frontend `.env` (or environment used by Vite) defines `VITE_COCOBASE_API_KEY`.

Integration examples (React)

1) Simple button-driven login

```tsx
import { login, getCurrentUser } from './services/auth';

async function onLoginClick(email: string, password: string) {
  try {
    const user = await login(email, password);
    console.log('Logged in user', user);
  } catch (err) {
    console.error(err);
  }
}

async function onGetUser() {
  const user = await getCurrentUser();
  console.log('current user', user);
}
```

2) Create project (after login)

```tsx
import { createProject, listUserProjects } from './services/projects';
import { getCurrentUser } from './services/auth';

async function onCreateProjectClick(name: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('not authenticated');
  const projectDoc = await createProject(user.id, name);
  console.log('project created', projectDoc);
}

async function onListMyProjects() {
  const user = await getCurrentUser();
  if (!user) return [];
  const projects = await listUserProjects(user.id);
  console.log('my projects', projects);
}
```

Error handling and UX
- All service functions throw on invalid input or permission failures. Catch errors in UI and present friendly messages.
- Because React Strict Mode may call components twice during development, ensure handlers are idempotent on UI (services themselves are safe as long as writes come only from explicit clicks).

Security & access control
- Services enforce membership checks for writes, but CocoBase project-level rules should also be configured to prevent unauthorized server-side writes.

Developer notes
- Do not call service write functions during component mount — always tie to user events (buttons/forms). This keeps the app consistent with architecture rules.
- Use the realtime subscription helpers and remember to cleanup (unsubscribe) on component unmount.

Where to look in the repo
- `src/lib/cocobase.ts` — client initialization (throws if API key missing)
- `src/services/auth.ts` — authentication wrappers
- `src/services/projects.ts` — project creation and membership
- `src/services/tasks.ts` — task management
- `src/services/activity.ts` — activity feed and subscriptions
