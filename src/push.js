// Push notifications through Firebase Cloud Messaging (Android app only; the browser version has none).
import { Capacitor } from "@capacitor/core";

// Server push is wired for Android only; iOS needs an APNs key and the Firebase Messaging SDK first.
export const pushSupported = () => Capacitor.getPlatform() === "android";
async function plugin() { return (await import("@capacitor/push-notifications")).PushNotifications; }

// Asks for permission and gets this device's token; onToken is called with it (again whenever it changes).
// One permission request at a time: Android drops a second request made while the first is still open.
let pending = null;
export function ensurePermission(onStep = () => {}) {
  if (!pending) pending = (async () => {
    const P = await plugin();
    let perm = await P.checkPermissions();
    onStep("permission " + perm.receive);
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") { perm = await P.requestPermissions(); onStep("asked, " + perm.receive); }
    return perm.receive;
  })().finally(() => { pending = null; });
  return pending;
}

// Resolves to "ok", "denied" (no permission) or "error".
export async function startPush(onToken, onError, onStep = () => {}) {
  if (!pushSupported()) return "error";
  try {
    onStep("plugin");
    const P = await plugin();
    if (await ensurePermission(onStep) !== "granted") return "denied";
    await P.removeAllListeners();
    await P.addListener("registration", t => { onToken(t.value); });
    await P.addListener("registrationError", e => { if (onError) onError((e && e.error) || "registration"); });
    try { await P.createChannel({ id: "default", name: "Talent Foxes", importance: 4, visibility: 1 }); } catch (e) {}
    onStep("registering");
    await P.register();
    onStep("waiting for the token");
    return "ok";
  } catch (e) { if (onError) onError(String((e && e.message) || e)); return "error"; }
}
export async function stopPush() {
  if (!pushSupported()) return;
  try { const P = await plugin(); await P.removeAllListeners(); await P.unregister(); } catch (e) {}
}
