# ExecutionOS

Real-time team task and accountability system built on CocoBase.

---

## Project Overview
ExecutionOS is a lightweight system for small teams to manage projects, assign tasks, and maintain an activity log with realtime updates.

Core features implemented in this repo:
- Authentication (signup, login, current user)
- Projects (create, list, membership)
- Tasks (create, assign, status updates)
- Activity logs (written by backend services)
- Realtime updates via CocoBase subscriptions

---

## Tech Stack
- Frontend: React + TypeScript (Vite)
- Backend: CocoBase JavaScript/TypeScript SDK (no custom server)

---

## Quickstart — Frontend

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/mayowa-kalejaiye/ExecutionOS.git
cd ExecutionOS/frontend
npm install
```

2. Provide your CocoBase API key via Vite env. Create a `.env` file in `frontend/` with:

```text
VITE_COCOBASE_API_KEY=your_cocobase_api_key_here
```

3. Start the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

Notes:
- The frontend uses the CocoBase SDK directly — there is no custom Express or Node backend.
- All writes are explicit and must be triggered by user actions (buttons/forms). Services do not write on component mount.

---

## Services (integration points for frontend)

Implementation lives under `src/services` in the frontend app. These modules wrap CocoBase calls and enforce access control and activity-logging rules.

- `src/services/auth.ts` — `signup`, `login`, `getCurrentUser`, `logout`, `onAuthEvent`
- `src/services/projects.ts` — `createProject`, `listUserProjects`, `addUserToProject`
- `src/services/tasks.ts` — `createTask`, `assignTask`, `updateTaskStatus`, `listProjectTasks`
- `src/services/activity.ts` — `listActivityLogs`, `subscribeActivityLogs`
- `src/services/hooks.ts` — small React hooks `useAuth` and `useProjects` to simplify integration (explicit calls only)

Integration rules:
- Do not call service functions that write data during render or on mount. Tie writes to user actions.
- Activity logs are created by these service modules; UI should not write activity entries directly.
- Use `subscribeActivityLogs` or `cocobase.realtime.collection(...)` to receive realtime updates and remember to unsubscribe on unmount.

---

## CocoBase setup (server-side)

Create the collections with the following authoritative names (case-sensitive):
- `projects`
- `project_members`
- `tasks`
- `activity_logs`

Configure CocoBase permissions/roles so that only authenticated users and project members can read/write their respective resources. The services in `src/services` enforce membership checks, but you should also enforce rules in CocoBase for defense in depth.

---

## Team & License

- Backend: Mayowa
- Frontend: Isaac

MIT
