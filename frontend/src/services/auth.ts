import { cocobase } from "../lib/cocobase.ts";
import type { AppUser } from "cocobase";

/*
 * Authentication service wrapper.
 * Provides explicit, user-triggered functions for signup, login and current user retrieval.
 * No writes occur automatically; callers must invoke these functions.
 */

// Register a new user (signup). Returns the created user object.
export async function signup(email: string, password: string, data?: Record<string, any>): Promise<AppUser> {
  // Explicit user action -> call Cocobase auth.register
  await cocobase.auth.register(email, password, data);
  // Auth handler stores the user in memory/localStorage; prefer authoritative fetch
  const user = cocobase.auth.getUser();
  if (!user) {
    // If not present, attempt to fetch current user from server
    return await cocobase.auth.getCurrentUser();
  }
  return user;
}

// Login an existing user with email/password. Returns the authenticated user.
export async function login(email: string, password: string): Promise<AppUser> {
  await cocobase.auth.login(email, password);
  const user = cocobase.auth.getUser();
  if (!user) {
    return await cocobase.auth.getCurrentUser();
  }
  return user;
}

// Returns the current authenticated user or null if unauthenticated.
export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    if (!cocobase.auth.isAuthenticated()) return null;
    const user = await cocobase.auth.getCurrentUser();
    return user ?? null;
  } catch (err) {
    return null;
  }
}

// Logout the current user. Explicit user-triggered write (clears session locally).
export function logout(): void {
  cocobase.auth.logout();
}

// Allow components to register auth callbacks (onLogin, onLogout, etc.)
export function onAuthEvent(callbacks: Partial<{
  onLogin: (user: AppUser, token: string) => void;
  onRegister: (user: AppUser, token: string) => void;
  onLogout: () => void;
  onUserUpdate: (user: AppUser) => void;
  onTokenChange: (token?: string) => void;
  onAuthStateChange: (user?: AppUser, token?: string) => void;
}>): void {
  // Pass through to Cocobase auth handler
  cocobase.auth.onAuthEvent(callbacks as any);
}

// Expose helper to check authentication status synchronously.
export function isAuthenticated(): boolean {
  return cocobase.auth.isAuthenticated();
}
