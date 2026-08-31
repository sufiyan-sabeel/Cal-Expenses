import { StorageKeys } from "../storage/keys";
import { loadOneSync, saveListSync, loadListSync } from "./base";
import type { UserProfile, AppSettings } from "../domain/models";
import { generateId, nowIso } from "../domain/common";
import { getStorageSync } from "../storage/storage-provider";

export const ProfileService = {
  get(): UserProfile | null {
    return loadOneSync<UserProfile>(StorageKeys.profile);
  },
  ensureForAuth(authUid: string, email: string, displayName: string, provider: "google" | "password"): UserProfile {
    let p = this.get();
    if (p && p.authUid === authUid) return p;
    // If profile exists but different uid, keep it? For V1 single local profile, overwrite if mismatch? Keep existing if email matches?
    if (p && p.email === email) {
      // update uid
      const updated = { ...p, authUid, displayName: displayName || p.displayName, email };
      getStorageSync().setSync(StorageKeys.profile, updated);
      return updated;
    }
    if (p) return p;
    const now = nowIso();
    const np: UserProfile = {
      id: generateId(),
      authUid,
      displayName: displayName || email.split("@")[0] || "User",
      email,
      authProvider: provider,
      currency: "INR",
      locale: "en-IN",
      dateFormat: "DMY",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
      firstDayOfWeek: 0,
      theme: "light",
      startingBalance: 0,
      defaultCategoryId: null,
      defaultPaymentMethod: null,
      defaultBudgetPeriod: "monthly",
      aiEnabled: true,
      aiConfirmationMode: "quick-add-undo",
      aiInsightFrequency: "weekly",
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    getStorageSync().setSync(StorageKeys.profile, np);
    // ensure settings
    const settings = loadOneSync<AppSettings>(StorageKeys.settings);
    if (!settings) {
      const now2 = nowIso();
      const s: AppSettings = {
        id: generateId(),
        upcomingBillsWindowDays: 7,
        upcomingEventsWindowDays: 14,
        notificationMutes: [],
        createdAt: now2,
        updatedAt: now2,
      };
      getStorageSync().setSync(StorageKeys.settings, s);
    }
    return np;
  },
  update(patch: Partial<UserProfile>): UserProfile {
    const p = this.get();
    if (!p) throw new Error("No profile");
    const updated = { ...p, ...patch, updatedAt: nowIso() } as UserProfile;
    getStorageSync().setSync(StorageKeys.profile, updated);
    return updated;
  },
  completeOnboarding(patch: Partial<UserProfile>): UserProfile {
    return this.update({ ...patch, onboardingCompleted: true });
  },
};

export const SettingsService = {
  get(): AppSettings | null {
    return loadOneSync<AppSettings>(StorageKeys.settings);
  },
  getOrCreate(): AppSettings {
    let s = this.get();
    if (s) return s;
    const now = nowIso();
    const ns: AppSettings = {
      id: generateId(),
      upcomingBillsWindowDays: 7,
      upcomingEventsWindowDays: 14,
      notificationMutes: [],
      createdAt: now,
      updatedAt: now,
    };
    getStorageSync().setSync(StorageKeys.settings, ns);
    return ns;
  },
  update(patch: Partial<AppSettings>): AppSettings {
    const s = this.getOrCreate();
    const updated = { ...s, ...patch, updatedAt: nowIso() } as AppSettings;
    getStorageSync().setSync(StorageKeys.settings, updated);
    return updated;
  },
};
