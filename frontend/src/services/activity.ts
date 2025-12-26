import { cocobase } from "../lib/cocobase.ts";
import type { Document as CBDocument } from "cocobase";

/*
 * Activity service
 * - listActivityLogs: read-only list of activity log documents for a project
 * - subscribeActivityLogs: subscribe to realtime events for activity_logs filtered by projectId
 *
 * Activity logs must be written by backend service modules (projects/tasks), not UI.
 */

export interface ActivityLog {
  projectId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
}

// Read-only listing of activity logs for a project.
export async function listActivityLogs(projectId: string, limit = 100): Promise<CBDocument<ActivityLog>[]> {
  if (!projectId) throw new Error("projectId is required");

  const logs = await cocobase.listDocuments<ActivityLog>("activity_logs", {
    filters: { projectId },
    limit,
    sort: "createdAt",
    order: "desc",
  });

  return logs;
}

// Subscribe to realtime activity log events for a project.
// Handlers receive the raw document payloads from Cocobase realtime watcher.
// Returns an unsubscribe function that will disconnect the watcher.
export function subscribeActivityLogs(
  projectId: string,
  handlers: Partial<{
    onConnected: (info: any) => void;
    onCreate: (doc: CBDocument<ActivityLog>) => void;
    onUpdate: (doc: CBDocument<ActivityLog>) => void;
    onDelete: (doc: CBDocument<ActivityLog>) => void;
    onError: (err: any) => void;
    onClose: (info: any) => void;
  }>
): () => void {
  if (!projectId) throw new Error("projectId is required");

  // Create a collection watcher scoped to this projectId
  const watcher = cocobase.realtime.collection("activity_logs", { projectId });

  // Attach handlers if provided
  handlers.onConnected && watcher.onConnected(handlers.onConnected);
  handlers.onCreate && watcher.onCreate(handlers.onCreate as any);
  handlers.onUpdate && watcher.onUpdate(handlers.onUpdate as any);
  handlers.onDelete && watcher.onDelete(handlers.onDelete as any);
  handlers.onError && watcher.onError(handlers.onError as any);
  handlers.onClose && watcher.onClose(handlers.onClose as any);

  // Start connection
  watcher.connect();

  // Return unsubscribe function
  return () => {
    try {
      watcher.disconnect();
    } catch (err) {
      // swallow to avoid throwing from cleanup
    }
  };
}
