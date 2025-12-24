# ExecutionOS

**Real-time team task and accountability system built with CocoBase backend.**

---

## Project Overview
ExecutionOS helps small teams manage projects, tasks, and track real-time activity.  
Features:
- User authentication
- Project creation & membership
- Task CRUD & assignment
- Real-time updates
- Activity log for accountability

---

## Tech Stack
- **Frontend:** React (or Next.js)
- **Backend:** CocoBase
- **Realtime:** CocoBase subscriptions
- **Authentication:** CocoBase Auth

---

## Setup Instructions

### Backend (CocoBase)
1. Sign up / login at CocoBase
2. Create collections: Users, Projects, ProjectMembers, Tasks, ActivityLogs
3. Set permissions according to schema
4. Connect frontend via CocoBase SDK or REST API

### Frontend
1. Clone repo
   ```bash
   git clone https://github.com/<your-org>/ExecutionOS.git
   cd ExecutionOS/frontend
2. Install dependencies
   ```bash
   npm install
3. Start dev server
   ```bash
   npm run dev

### Folder Structure

- backend/ – CocoBase logic, collections, permissions
- frontend/ – React app
- docs/ – API contracts and architecture diagrams

### Team

- Backend: Mayowa
- Frontend: Isaac
- UI/UX: 13:11

### License

MIT
