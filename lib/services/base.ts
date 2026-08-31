import { StorageKeys } from "../storage/keys";
import type { StorageKey } from "../storage/keys";
import { getStorage, getStorageSync } from "../storage/storage-provider";

export async function loadList<T>(key: string): Promise<T[]> {
  const s = getStorage();
  const v = await s.get<T[]>(key);
  return (v as T[]) ?? [];
}

export function loadListSync<T>(key: string): T[] {
  const s = getStorageSync();
  const v = s.getSync<T[]>(key);
  return (v as T[]) ?? [];
}

export async function saveList<T>(key: string, list: T[]): Promise<void> {
  const s = getStorage();
  await s.set(key, list);
}

export function saveListSync<T>(key: string, list: T[]): void {
  const s = getStorageSync();
  s.setSync(key, list);
}

export async function loadOne<T>(key: string): Promise<T | null> {
  const s = getStorage();
  return (await s.get<T>(key)) ?? null;
}

export function loadOneSync<T>(key: string): T | null {
  return getStorageSync().getSync<T>(key);
}
