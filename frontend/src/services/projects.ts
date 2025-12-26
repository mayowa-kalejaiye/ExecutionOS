import { cocobase } from "../lib/cocobase.ts";
import type { Document as CBDocument } from "cocobase";

/*
 * Projects service
 * - createProject: creates a project and adds the owner as a project member
 * - listUserProjects: returns projects the user belongs to
 * - addUserToProject: adds a user to a project (only allowed by existing project members)
 *
 * All writes are explicit and user-triggered. Activity logs are written here by backend
 * logic so UI components don't directly write activity entries.
 */

export interface Project {
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  joinedAt: string;
}

export interface ActivityLog {
  projectId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
}

// Create a new project. Returns the created project document.
export async function createProject(ownerId: string, name: string): Promise<CBDocument<Project>> {
  if (!ownerId) throw new Error("ownerId is required");
  if (!name) throw new Error("project name is required");

  const createdAt = new Date().toISOString();

  // Create project document
  const project = await cocobase.createDocument<Project>("projects", {
    name,
    ownerId,
    createdAt,
  });

  // Add owner as a project member
  await cocobase.createDocument<ProjectMember>("project_members", {
    projectId: project.id,
    userId: ownerId,
    joinedAt: createdAt,
  });

  // Write activity log for project creation
  await cocobase.createDocument<ActivityLog>("activity_logs", {
    projectId: project.id,
    actorId: ownerId,
    entityType: "project",
    entityId: project.id,
    action: "create",
    createdAt,
  });

  return project;
}

// List projects that the user belongs to. Returns project documents.
export async function listUserProjects(userId: string): Promise<CBDocument<Project>[]> {
  if (!userId) throw new Error("userId is required");

  // Find memberships for the user
  const memberships = await cocobase.listDocuments<ProjectMember>("project_members", {
    filters: { userId },
    limit: 100,
  });

  if (!memberships || memberships.length === 0) return [];

  // Fetch each project by id
  const projects = await Promise.all(
    memberships.map(async (m) => {
      return await cocobase.getDocument<Project>("projects", m.data.projectId);
    })
  );

  return projects;
}

// Add a user to a project. Only an existing project member may add another user.
// actorId is the user performing the action (for permission check and activity log).
export async function addUserToProject(projectId: string, userId: string, actorId: string): Promise<CBDocument<ProjectMember>> {
  if (!projectId) throw new Error("projectId is required");
  if (!userId) throw new Error("userId is required");
  if (!actorId) throw new Error("actorId is required");

  // Verify actor is a member of the project
  const actorMemberships = await cocobase.listDocuments<ProjectMember>("project_members", {
    filters: { projectId, userId: actorId },
    limit: 1,
  });
  if (!actorMemberships || actorMemberships.length === 0) {
    throw new Error("actor is not a member of the project");
  }

  // Prevent duplicate membership
  const exists = await cocobase.listDocuments<ProjectMember>("project_members", {
    filters: { projectId, userId },
    limit: 1,
  });
  if (exists && exists.length > 0) {
    throw new Error("user is already a member of the project");
  }

  const joinedAt = new Date().toISOString();

  const member = await cocobase.createDocument<ProjectMember>("project_members", {
    projectId,
    userId,
    joinedAt,
  });

  // Activity log for adding member
  await cocobase.createDocument<ActivityLog>("activity_logs", {
    projectId,
    actorId,
    entityType: "project_member",
    entityId: member.id,
    action: "add_member",
    createdAt: joinedAt,
  });

  return member;
}
