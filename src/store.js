// Live data from Firestore plus every write the app makes.
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, writeBatch, arrayUnion, increment } from "firebase/firestore";
import { auth, db, googleSignIn, appSignOut, passwordSignIn, createChildAuthUser } from "./fb.js";
import { KID_EMAIL_DOMAIN } from "./config.js";
import { derive, newKidDoc, newInviteCode, normLogin, normCode, kidEmail, streakAfter, today, uid, planFee, defaultRules } from "./domain.js";

// role: null (signed out) | "parent" | "kid"
export const M = { ready: false, user: null, role: null, family: null, kids: [], error: "", shared: { rules: [], rulesSaved: false, pot: { total: 0, goalTitle: "", goalCost: 0 } } };

let notify = () => {};
let unsubs = [];
let kidSubs = new Map();
let kidDocs = [];
const LOGS = new Map(), ORDERS = new Map();

function stopAll() {
  M.shared = { rules: [], rulesSaved: false, pot: { total: 0, goalTitle: "", goalCost: 0 } };
  unsubs.forEach(f => f()); unsubs = [];
  kidSubs.forEach(arr => arr.forEach(f => f())); kidSubs = new Map();
  kidDocs = []; LOGS.clear(); ORDERS.clear();
}
function rebuild() {
  M.kids = kidDocs.map(d => derive(d, LOGS.get(d.id) || [], ORDERS.get(d.id) || []));
  notify();
}
const rows = snap => snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
const famRef = () => doc(db, "families", M.family.id);
const kidRef = id => doc(db, "families", M.family.id, "kids", id);

function watchKids(fid, snapQuery) {
  unsubs.push(onSnapshot(snapQuery, snap => {
    kidDocs = rows(snap).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    const ids = new Set(kidDocs.map(d => d.id));
    kidSubs.forEach((arr, id) => { if (!ids.has(id)) { arr.forEach(f => f()); kidSubs.delete(id); LOGS.delete(id); ORDERS.delete(id); } });
    kidDocs.forEach(d => {
      if (kidSubs.has(d.id)) return;
      const base = ["families", fid, "kids", d.id];
      kidSubs.set(d.id, [
        onSnapshot(collection(db, ...base, "log"), s => { LOGS.set(d.id, rows(s)); rebuild(); }, onErr),
        onSnapshot(collection(db, ...base, "orders"), s => { ORDERS.set(d.id, rows(s)); rebuild(); }, onErr)
      ]);
    });
    rebuild();
  }, onErr));
}
// family-wide documents: rules and the family pot (readable by the parents and by the family's children)
function watchShared(fid) {
  unsubs.push(onSnapshot(collection(db, "families", fid, "shared"), snap => {
    const by = {}; snap.docs.forEach(d => { by[d.id] = d.data(); });
    M.shared = {
      rules: (by.rules && by.rules.items) || [], rulesSaved: !!by.rules,
      pot: Object.assign({ total: 0, goalTitle: "", goalCost: 0 }, by.pot || {})
    };
    notify();
  }, onErr));
}
function onErr(e) { M.error = e && e.code ? e.code : String(e); notify(); }

async function loadParent(user) {
  const q = query(collection(db, "families"), where("parentUids", "array-contains", user.uid));
  unsubs.push(onSnapshot(q, snap => {
    const d = snap.docs[0];
    const fid = d ? d.id : null;
    if (!fid) { M.family = null; notify(); return; }
    const first = !M.family || M.family.id !== fid;
    M.family = Object.assign({ id: fid }, d.data());
    if (first) { watchKids(fid, collection(db, "families", fid, "kids")); watchShared(fid); }
    notify();
  }, onErr));
}

async function loadKid(user) {
  const m = /__([a-z0-9]+)@/.exec(user.email || "");
  if (!m) throw new Error("bad-account");
  const inv = await getDoc(doc(db, "invites", m[1]));
  if (!inv.exists()) throw new Error("no-family");
  const fid = inv.data().fid;
  M.family = { id: fid };
  watchShared(fid);
  watchKids(fid, query(collection(db, "families", fid, "kids"), where("kidUid", "==", user.uid)));
}

export function start(onChange) {
  notify = onChange;
  onAuthStateChanged(auth, async user => {
    stopAll(); M.user = user; M.family = null; M.kids = []; M.error = ""; M.role = null;
    if (user) {
      try {
        if (user.providerData.some(p => p.providerId === "google.com")) { M.role = "parent"; await loadParent(user); }
        else { M.role = "kid"; await loadKid(user); }
      } catch (e) { M.error = e.code || e.message; }
    }
    M.ready = true; notify();
  });
}

// ---- sign in / out ----
export const parentSignIn = () => googleSignIn();
export const signOutAll = () => appSignOut();
export async function kidSignIn(code, loginRaw, pw) {
  code = normCode(code); const login = normLogin(loginRaw);
  if (!code || !login) throw new Error("nologin");
  const l = await getDoc(doc(db, "logins", `${code}__${login}`));
  if (!l.exists()) throw new Error("nologin");
  await passwordSignIn(kidEmail(login, code, l.data().v || 0, KID_EMAIL_DOMAIN), pw);
}

// ---- family ----
export async function createFamily(name) {
  const fid = doc(collection(db, "families")).id, code = newInviteCode(), b = writeBatch(db);
  b.set(doc(db, "families", fid), { name, parentUids: [M.user.uid], inviteCode: code, createdAt: Date.now() });
  b.set(doc(db, "invites", code), { fid });
  await b.commit();
}
export async function joinFamily(codeRaw) {
  const code = normCode(codeRaw), inv = await getDoc(doc(db, "invites", code));
  if (!inv.exists()) throw new Error("bad-code");
  await updateDoc(doc(db, "families", inv.data().fid), { parentUids: arrayUnion(M.user.uid), joinProof: code });
}
export const renameFamily = name => updateDoc(famRef(), { name });

// ---- children (parent) ----
export async function addKid(name, loginRaw, pw) {
  const login = normLogin(loginRaw), code = M.family.inviteCode;
  if (!name.trim() || !login) throw new Error("need-name");
  if (pw.length < 6) throw new Error("weak-password");
  const lg = doc(db, "logins", `${code}__${login}`);
  if ((await getDoc(lg)).exists()) throw new Error("login-taken");
  const kidUid = await createChildAuthUser(kidEmail(login, code, 0, KID_EMAIL_DOMAIN), pw);
  const ref = doc(collection(db, "families", M.family.id, "kids")), b = writeBatch(db);
  b.set(ref, newKidDoc(name.trim().slice(0, 20), login, kidUid));
  b.set(lg, { fid: M.family.id, v: 0 });
  await b.commit();
  return ref.id;
}
export async function resetKidPassword(kid, pw) {
  if (pw.length < 6) throw new Error("weak-password");
  const code = M.family.inviteCode, v = (kid.authVersion || 0) + 1;
  const kidUid = await createChildAuthUser(kidEmail(kid.login, code, v, KID_EMAIL_DOMAIN), pw);
  const b = writeBatch(db);
  b.update(kidRef(kid.id), { kidUid, authVersion: v });
  b.set(doc(db, "logins", `${code}__${kid.login}`), { fid: M.family.id, v });
  await b.commit();
}
export async function deleteKid(kid) {
  const base = ["families", M.family.id, "kids", kid.id];
  for (const sub of ["log", "orders"]) {
    const s = await getDocs(collection(db, ...base, sub));
    for (let i = 0; i < s.docs.length; i += 400) { const b = writeBatch(db); s.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
  }
  const b = writeBatch(db); b.delete(kidRef(kid.id)); b.delete(doc(db, "logins", `${M.family.inviteCode}__${kid.login}`)); await b.commit();
}
export const renameKid = (kid, name) => updateDoc(kidRef(kid.id), { name });
export const saveTasks = (kid, tasks) => updateDoc(kidRef(kid.id), { tasks });
export const saveRewards = (kid, rewards) => updateDoc(kidRef(kid.id), { rewards });
export const saveEconomy = (kid, economy) => updateDoc(kidRef(kid.id), { economy });
export const savePlaylists = (kid, playlists) => updateDoc(kidRef(kid.id), { playlists });

// ---- approvals (parent) ----
export async function decideLog(kid, entry, ok) {
  await updateDoc(doc(db, "families", M.family.id, "kids", kid.id, "log", entry.id), { status: ok ? "done" : "rejected" });
  if (ok) { const patch = streakAfter(kid, entry.day); if (patch) await updateDoc(kidRef(kid.id), patch); }
  if (ok && entry.kind === "repair") await adjustPot(-entry.stars);
}
export const decideOrder = (kid, order, status) => updateDoc(doc(db, "families", M.family.id, "kids", kid.id, "orders", order.id), { status });
export const giveBonus = (kid, n, why) => addDoc(collection(db, "families", M.family.id, "kids", kid.id, "log"), { type: "bonus", taskId: "bonus", title: why || "Бонус за старание", kind: "bonus", stars: n, status: "done", day: today(), ts: Date.now() });
const sharedDoc = id => doc(db, "families", M.family.id, "shared", id);
export const saveRules = items => setDoc(sharedDoc("rules"), { items });
export const seedRules = () => saveRules(defaultRules());
export const saveGoal = (goalTitle, goalCost) => setDoc(sharedDoc("pot"), { goalTitle, goalCost }, { merge: true });
export const adjustPot = n => setDoc(sharedDoc("pot"), { total: increment(n) }, { merge: true });
export const resetPot = () => setDoc(sharedDoc("pot"), { total: 0 }, { merge: true });

// Apply a family rule to a child: a reminder the first time within a week, a contribution afterwards.
export async function applyRule(kid, rule) {
  const plan = planFee(kid, rule), ref = doc(collection(db, "families", M.family.id, "kids", kid.id, "log"));
  const b = writeBatch(db), base = { ruleId: rule.id, title: rule.title, status: "done", day: today(), ts: Date.now() };
  if (plan.kind === "fee") {
    b.set(ref, Object.assign({ type: "fee", kind: "fee", taskId: "fee", stars: plan.amount, repair: rule.repair || "" }, base));
    b.set(sharedDoc("pot"), { total: increment(plan.amount) }, { merge: true });
  } else {
    b.set(ref, Object.assign({ type: "warn", kind: "warn", taskId: "warn", stars: 0 }, base));
  }
  await b.commit();
  return plan;
}
// Undo a reminder or contribution; the pot gives the stars back too.
export async function undoRule(kid, entry) {
  const b = writeBatch(db);
  b.delete(doc(db, "families", M.family.id, "kids", kid.id, "log", entry.id));
  if (entry.kind === "fee") b.set(sharedDoc("pot"), { total: increment(-entry.stars) }, { merge: true });
  await b.commit();
}
export const deleteLog = (kid, entry) => deleteDoc(doc(db, "families", M.family.id, "kids", kid.id, "log", entry.id));

// ---- child actions ----
export function submitTask(kid, task, extra = {}) {
  return addDoc(collection(db, "families", M.family.id, "kids", kid.id, "log"), Object.assign({ type: "task", taskId: task.id, title: task.title, kind: task.kind, stars: task.stars, status: "pending", day: today(), ts: Date.now() }, extra));
}
export function orderReward(kid, r) {
  return addDoc(collection(db, "families", M.family.id, "kids", kid.id, "orders"), { kind: "reward", refId: r.id, title: r.title, icon: r.icon || "🎁", cost: r.cost, status: "pending", ts: Date.now() });
}
export async function buyAccessory(kid, a, equipped) {
  await addDoc(collection(db, "families", M.family.id, "kids", kid.id, "orders"), { kind: "acc", refId: a.id, title: a.name, icon: a.emo, cost: a.cost, status: "auto", ts: Date.now() });
  await updateDoc(kidRef(kid.id), { pet: Object.assign({}, kid.pet, { owned: (kid.pet.owned || []).concat(a.id), equipped }) });
}
export const savePet = (kid, pet) => updateDoc(kidRef(kid.id), { pet });
export const saveAccent = (kid, accent) => updateDoc(kidRef(kid.id), { accent });

export { uid };
