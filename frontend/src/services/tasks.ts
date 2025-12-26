import { cocobase } from "../lib/cocobase.ts";
import type { Document as CBDocument } from "cocobase";

/*
 * Tasks service
 * - createTask: explicit creation guarded by project membership
 * - assignTask: assign a task to a user (both actor and assignee must be project members)
 * - updateTaskStatus: change a task's status (actor must be project member)
 * - listProjectTasks: read-only listing of tasks for a project
 *
 * Activity logs are written here so UI components never write logs directly.
 */

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  projectId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
}

async function isProjectMember(userId: string, projectId: string): Promise<boolean> {
  if (!userId || !projectId) return false;
  const membership = await cocobase.listDocuments("project_members", {
    filters: { projectId, userId },
    limit: 1,
  });
  return !!(membership && membership.length > 0);
}

// Create a task under a project. Actor must be a member. Assignee (if provided) must also be a member.
export async function createTask(
  actorId: string,
  projectId: string,
  title: string,
  description?: string,
  assigneeId?: string | null,
  dueDate?: string | null
): Promise<CBDocument<Task>> {
  if (!actorId) throw new Error("actorId is required");
  if (!projectId) throw new Error("projectId is required");
  if (!title) throw new Error("title is required");

  // Permission: actor must be member
  const actorIsMember = await isProjectMember(actorId, projectId);
  if (!actorIsMember) throw new Error("actor is not a member of the project");

  // If assignee provided, ensure they are a member
  if (assigneeId) {
    const assigneeIsMember = await isProjectMember(assigneeId, projectId);
    if (!assigneeIsMember) throw new Error("assignee is not a member of the project");
  }

  const now = new Date().toISOString();

  const task = await cocobase.createDocument<Task>("tasks", {
    projectId,
    title,
    description: description ?? null,
    status: "todo",
    assigneeId: assigneeId ?? null,
    dueDate: dueDate ?? null,
    createdAt: now,
    updatedAt: now,
  });

  // Activity log for task creation
  await cocobase.createDocument<ActivityLog>("activity_logs", {
    projectId,
    actorId,
    entityType: "task",
    entityId: task.id,
    action: "create",
    createdAt: now,
  });

  return task;
}

// Assign a task to a user. Actor must be a member; assignee must be a member as well.
export async function assignTask(actorId: string, taskId: string, assigneeId: string): Promise<CBDocument<Task>> {
  if (!actorId) throw new Error("actorId is required");
  if (!taskId) throw new Error("taskId is required");
  if (!assigneeId) throw new Error("assigneeId is required");

  const task = await cocobase.getDocument<Task>("tasks", taskId);
  const projectId = task.data.projectId;

  // Permission checks
  const actorIsMember = await isProjectMember(actorId, projectId);
  if (!actorIsMember) throw new Error("actor is not a member of the project");
  const assigneeIsMember = await isProjectMember(assigneeId, projectId);
  if (!assigneeIsMember) throw new Error("assignee is not a member of the project");

  const now = new Date().toISOString();

  const updated = await cocobase.updateDocument<Task>("tasks", taskId, {
    assigneeId,
    updatedAt: now,
  });

  // Activity log for assignment
  await cocobase.createDocument<ActivityLog>("activity_logs", {
    projectId,
    actorId,
    entityType: "task",
    entityId: taskId,
    action: "assign",
    createdAt: now,
  });

  return updated;
}

// Update a task's status. Actor must be a project member.
export async function updateTaskStatus(actorId: string, taskId: string, status: TaskStatus): Promise<CBDocument<Task>> {
  if (!actorId) throw new Error("actorId is required");
  if (!taskId) throw new Error("taskId is required");
  if (!status) throw new Error("status is required");
  if (!["todo", "doing", "done"].includes(status)) throw new Error("invalid status");

  const task = await cocobase.getDocument<Task>("tasks", taskId);
  const projectId = task.data.projectId;

  const actorIsMember = await isProjectMember(actorId, projectId);
  if (!actorIsMember) throw new Error("actor is not a member of the project");

  const now = new Date().toISOString();

  const updated = await cocobase.updateDocument<Task>("tasks", taskId, {
    status,
    updatedAt: now,
  });

  // Activity log for status change
  await cocobase.createDocument<ActivityLog>("activity_logs", {
    projectId,
    actorId,
    entityType: "task",
    entityId: taskId,
    action: `status:${status}`,
    createdAt: now,
  });

  return updated;
}

// Read-only: list tasks for a project.
export async function listProjectTasks(projectId: string): Promise<CBDocument<Task>[]> {
  if (!projectId) throw new Error("projectId is required");
  const tasks = await cocobase.listDocuments<Task>("tasks", {
    filters: { projectId },
    limit: 200,
  });
  return tasks;
}
