"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, isFirebaseConfigured } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, sendPasswordResetEmail, updateProfile, type User } from "firebase/auth";
import { googleProvider } from "./firebase";
import { ProfileService } from "@/lib/services/profile.service";

// Local fallback user when Firebase not configured
type LocalUser = { uid: string; email: string; displayName: string; provider: "password" };

type AuthCtx = {
  user: User | LocalUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

function getLocalUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("calexpenses:v1:localAuthUser");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setLocalUser(u: LocalUser | null) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem("calexpenses:v1:localAuthUser", JSON.stringify(u));
  else localStorage.removeItem("calexpenses:v1:localAuthUser");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | LocalUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const lu = getLocalUser();
      setUser(lu);
      setLoading(false);
      if (lu) ProfileService.ensureForAuth(lu.uid, lu.email, lu.displayName, "password");
      return;
    }
    // Handle redirect result (if user used signInWithRedirect fallback)
    getRedirectResult(auth).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setUser(u as User | null);
      setLoading(false);
      if (u) {
        ProfileService.ensureForAuth(u.uid, u.email ?? "", u.displayName ?? "", u.providerData[0]?.providerId === "google.com" ? "google" : "password");
      }
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      // local fallback: check stored local users list (simple)
      // For V1 local mode, we just create session if email/password match simple check; we don't store password hash securely but keep local
      // We'll allow any email with password length >=8 to simulate login, creating local user if not exists
      // Check local users storage
      const stored = (() => { try { return JSON.parse(localStorage.getItem("calexpenses:v1:localUsers") ?? "[]"); } catch { return []; } })() as LocalUser[] & { password?: string }[];
      // Actually store with password marker locally (not secure but for offline demo)
      const found = (JSON.parse(localStorage.getItem("calexpenses:v1:localUsersDB") ?? "[]") as { email: string; password: string; uid: string; displayName: string }[]).find((x) => x.email === email);
      if (!found || found.password !== password) throw new Error("Invalid email or password (local mode)");
      const lu: LocalUser = { uid: found.uid, email: found.email, displayName: found.displayName, provider: "password" };
      setLocalUser(lu);
      setUser(lu);
      ProfileService.ensureForAuth(lu.uid, lu.email, lu.displayName, "password");
      return;
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isFirebaseConfigured || !auth) {
      const uid = `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const lu: LocalUser = { uid, email, displayName: name ?? email.split("@")[0] ?? "User", provider: "password" };
      const dbRaw = localStorage.getItem("calexpenses:v1:localUsersDB");
      const db = dbRaw ? JSON.parse(dbRaw) as { email: string; password: string; uid: string; displayName: string }[] : [];
      if (db.some((x) => x.email === email)) throw new Error("Email already registered (local mode)");
      db.push({ email, password, uid, displayName: lu.displayName });
      localStorage.setItem("calexpenses:v1:localUsersDB", JSON.stringify(db));
      setLocalUser(lu);
      setUser(lu);
      ProfileService.ensureForAuth(lu.uid, lu.email, lu.displayName, "password");
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name && cred.user) {
      try { await updateProfile(cred.user, { displayName: name }); } catch {}
    }
    ProfileService.ensureForAuth(cred.user.uid, cred.user.email ?? email, name ?? cred.user.displayName ?? email.split("@")[0] ?? "User", "password");
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) throw new Error("Google sign-in requires Firebase configuration. Use email/password in local mode.");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Immediately ensure local profile is created — don't wait for onAuthStateChanged
      if (result.user) {
        const u = result.user;
        ProfileService.ensureForAuth(u.uid, u.email ?? "", u.displayName ?? u.email?.split("@")[0] ?? "User", "google");
        setFirebaseUser(u);
        setUser(u);
      }
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // Fallback to redirect for blocked popups (common on GitHub Pages mobile)
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw e;
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured || !auth) {
      setLocalUser(null);
      setUser(null);
      return;
    }
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured || !auth) throw new Error("Password reset requires Firebase. Contact support in local mode.");
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <Ctx.Provider value={{ user, firebaseUser, loading, isConfigured: isFirebaseConfigured, signIn, signUp, signInWithGoogle, logout, resetPassword }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
