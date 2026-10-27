// Push notifications through Firebase Cloud Messaging (Android app only; the browser version has none).
import { Capacitor } from "@capacitor/core";

export const pushSupported = () => Capacitor.isNativePlatform();
async function plugin() { return (await import("@capacitor/push-notifications")).PushNotifications; }

// Asks for permission and gets this device's token; onToken is called with it (again whenever it changes).
// Resolves to "ok", "denied" (no permission) or "error".
export async function startPush(onToken, onError, onStep = () => {}) {
  if (!pushSupported()) return "error";
  try {
    onStep("plugin");
    const P = await plugin();
    let perm = await P.checkPermissions();
    onStep("permission " + perm.receive);
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") { perm = await P.requestPermissions(); onStep("asked, " + perm.receive); }
    if (perm.receive !== "granted") return "denied";
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
