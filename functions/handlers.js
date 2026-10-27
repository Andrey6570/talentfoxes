// What happens on each database change. The Firebase services are passed in, so this file can be tested without them.
import { compose } from "./messages.js";

const LANGS = ["ru", "en", "el"];
const DEAD = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"];

async function devices(db, fid, field, value) {
  const snap = await db.collection(`families/${fid}/devices`).where(field, "==", value).get();
  return snap.docs.map(d => ({ ref: d.ref, token: d.data().token, lang: LANGS.includes(d.data().lang) ? d.data().lang : "en" })).filter(d => d.token);
}

// One message per language; devices whose token is no longer valid are removed.
async function send({ messaging }, list, build) {
  const byLang = {};
  list.forEach(d => { (byLang[d.lang] = byLang[d.lang] || []).push(d); });
  for (const [lang, group] of Object.entries(byLang)) {
    const { title, body } = build(lang);
    const res = await messaging.sendEachForMulticast({
      tokens: group.map(d => d.token), notification: { title, body },
      android: { priority: "high", notification: { channelId: "default" } }
    });
    await Promise.all(res.responses.map((r, i) => (!r.success && r.error && DEAD.includes(r.error.code)) ? group[i].ref.delete() : null));
  }
  return list.length;
}

export async function onLogCreated(deps, { fid, kidId, data }) {
  if (!data || data.type !== "task" || data.status !== "pending") return 0;
  const kid = await deps.db.doc(`families/${fid}/kids/${kidId}`).get();
  const name = (kid.exists && kid.data().name) || "";
  return send(deps, await devices(deps.db, fid, "role", "parent"), lang => compose("logPending", lang, { kid: name, title: data.title, stars: data.stars }));
}

export async function onLogUpdated(deps, { fid, kidId, before, after }) {
  if (!before || !after || after.type !== "task" || before.status !== "pending" || after.status !== "done") return 0;
  return send(deps, await devices(deps.db, fid, "kidId", kidId), lang => compose("approved", lang, { title: after.title, stars: after.stars }));
}

export async function onOrderCreated(deps, { fid, kidId, data }) {
  if (!data || data.kind !== "reward" || data.status !== "pending") return 0;
  const kid = await deps.db.doc(`families/${fid}/kids/${kidId}`).get();
  const name = (kid.exists && kid.data().name) || "";
  return send(deps, await devices(deps.db, fid, "role", "parent"), lang => compose("orderPending", lang, { kid: name, title: data.title, cost: data.cost }));
}

// New tasks reach the child; a changed sign-in account (password reset) removes the old one.
export async function onKidUpdated(deps, { fid, kidId, before, after }) {
  let sent = 0;
  if (before && after && before.kidUid && before.kidUid !== after.kidUid) await removeAccount(deps, before.kidUid);
  const had = new Set(((before && before.tasks) || []).map(t => t.id));
  const fresh = ((after && after.tasks) || []).filter(t => !had.has(t.id));
  if (!fresh.length || !before) return sent;
  const list = await devices(deps.db, fid, "kidId", kidId);
  if (fresh.length <= 2) { for (const t of fresh) sent += await send(deps, list, lang => compose("taskAssigned", lang, { title: t.title, stars: t.stars })); }
  else sent += await send(deps, list, lang => compose("tasksAssigned", lang, { count: fresh.length }));
  return sent;
}

export async function onKidDeleted(deps, { fid, kidId, data }) {
  if (data && data.kidUid) await removeAccount(deps, data.kidUid);
  const snap = await deps.db.collection(`families/${fid}/devices`).where("kidId", "==", kidId).get();
  await Promise.all(snap.docs.map(d => d.ref.delete()));
}

async function removeAccount({ auth }, uid) {
  try { await auth.deleteUser(uid); } catch (e) { if (!e || e.code !== "auth/user-not-found") throw e; }
}
