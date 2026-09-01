"use client";

// Simple alarm using Web Audio + Notification API
export function playAlarm(durationMs = 3000): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    // beep pattern
    let on = true;
    const iv = setInterval(() => {
      gain.gain.value = on ? 0.12 : 0.02;
      on = !on;
    }, 180);
    setTimeout(() => { clearInterval(iv); try { osc.stop(); ctx.close(); } catch {} }, durationMs);
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const res = await Notification.requestPermission();
  return res === "granted";
}

export function showAlarmNotification(title: string, body: string): void {
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/icon-192.svg", badge: "/icon-192.svg" }); } catch {}
  }
}

export function setAlarmReminder(title: string, body: string, when: Date, sound = true): number {
  const delay = when.getTime() - Date.now();
  if (delay <= 0) {
    if (sound) playAlarm();
    showAlarmNotification(title, body);
    return 0;
  }
  const id = window.setTimeout(async () => {
    if (sound) playAlarm();
    showAlarmNotification(title, body);
    // also trigger app refresh to show in notification center
    window.dispatchEvent(new Event("calexpenses:refresh"));
  }, delay);
  return id;
}
