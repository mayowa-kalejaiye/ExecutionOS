import { useEffect, useState, useRef } from "react";
import { cocobase } from "../lib/cocobase.ts";
import type { AppUser } from "cocobase";
import {
  signup as signupSvc,
  login as loginSvc,
  getCurrentUser as getCurrentUserSvc,
  logout as logoutSvc,
  isAuthenticated as isAuthenticatedSvc,
} from "./auth";
import { createProject as createProjectSvc, listUserProjects as listUserProjectsSvc } from "./projects";
import type { Project } from "./projects";

/*
 * Lightweight React hooks to integrate with the services layer.
 * - No automatic writes on mount.
 * - Exposes explicit methods that UI can call from event handlers.
 */

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Initialize auth state by restoring session from local storage (explicit)
  async function initAuth(): Promise<void> {
    setLoading(true);
    try {
      await cocobase.auth.initAuth();
      const cur = cocobase.auth.getUser();
      if (mounted.current) setUser(cur ?? null);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  async function signup(email: string, password: string, data?: Record<string, any>): Promise<AppUser> {
    setLoading(true);
    try {
      const u = await signupSvc(email, password, data);
      if (mounted.current) setUser(u);
      return u;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<AppUser> {
    setLoading(true);
    try {
      const u = await loginSvc(email, password);
      if (mounted.current) setUser(u);
      return u;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  async function getCurrentUser(): Promise<AppUser | null> {
    setLoading(true);
    try {
      const u = await getCurrentUserSvc();
      if (mounted.current) setUser(u);
      return u;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  function logout(): void {
    logoutSvc();
    if (mounted.current) setUser(null);
  }

  function isAuthenticated(): boolean {
    return isAuthenticatedSvc();
  }

  // Register auth callbacks. Returns an unsubscribe which clears callbacks.
  function onAuthEvent(callbacks: Parameters<typeof cocobase.auth.onAuthEvent>[0]) {
    cocobase.auth.onAuthEvent(callbacks as any);
    return () => {
      // Clears all registered callbacks on the underlying auth handler
      // (safe because components should clean up their own callbacks)
      cocobase.auth.clearAuthCallbacks?.();
    };
  }

  return {
    user,
    loading,
    initAuth,
    signup,
    login,
    getCurrentUser,
    logout,
    isAuthenticated,
    onAuthEvent,
  } as const;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Create project (explicit user action)
  async function createProject(ownerId: string, name: string) {
    setLoading(true);
    try {
      const doc = await createProjectSvc(ownerId, name);
      return doc;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  // List projects for a user
  async function listUserProjects(userId: string) {
    setLoading(true);
    try {
      const docs = await listUserProjectsSvc(userId);
      const result = docs.map((d) => d.data);
      if (mounted.current) setProjects(result);
      return docs;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  return {
    projects,
    loading,
    createProject,
    listUserProjects,
  } as const;
}
