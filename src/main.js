import "./styles.css";
import { t, tf, getLang, setLang, disp } from "./i18n.js";
import * as V from "./views.js";
import { M, start, parentSignIn, signOutAll, kidSignIn, createFamily, joinFamily, renameFamily, addKid, resetKidPassword, deleteKid, renameKid,
  saveTasks, saveRewards, savePlaylists, saveEconomy, saveEvent, saveScale, deleteEvent, addPackTasks, addPackRewards, deleteFamilyAndAccount, leaveFamilyAndDeleteAccount, deleteLog, setOnEvent, saveRules, seedRules, saveGoal, adjustPot, resetPot, applyRule, undoRule, decideLog, decideOrder, giveBonus, submitTask, orderReward, buyAccessory, savePet, saveAccent } from "./store.js";
import { FEE_CAP_ONCE, newRun, rescaleKid, reminderPlan, parseDay, runRemaining, pauseRun, resumeRun, finishRun, fmtMs, speedPayload } from "./domain.js";
import { Capacitor } from "@capacitor/core";
import { ACCENTS, ACCESSORIES, CHALLENGES, SAYS, mood, today, zoneTask, checkUrl, normCode, uid, taskStars, normLogin } from "./domain.js";

const $ = s => document.querySelector(s);
const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

const THEME_KEY = "talent-foxes-theme", NOTIFY_KEY = "talent-foxes-notify", ASKED_KEY = "talent-foxes-notify-asked";
const ui = { settingsPage: null, helpTab: "guide", helpWho: null, helpOpen: new Set(), helpTouched: false, econPending: null, sched: null, ntDays: [], hello: null, justAdded: null, packAge: "a8", delStage: null, notify: LS.get(NOTIFY_KEY) !== "off", settings: false, theme: LS.get(THEME_KEY) || "system", bonusN: 3, welcome: "choose", err: "", busy: false, tab: "home", kCode: LS.get("talent-foxes-code") || "", kLogin: LS.get("talent-foxes-login") || "",
  ruleId: null, wheelRot: 0, spinning: false, pick: null, mins: 10, run: null, pk: null, delKid: null };
const demoState = window.__demoState; // used by the layout smoke test only
const S = demoState || M;

// ---------- messages ----------
function errText(e) {
  const c = (e && (e.code || e.message)) || "";
  if (/popup-closed|cancel|canceled|12501|user-cancelled/i.test(c)) return "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return t("Неверный логин или пароль");
  if (/nologin|no-family|bad-account/.test(c)) return t("Такого ребёнка не нашли. Проверьте код семьи и логин.");
  if (/bad-code/.test(c)) return t("Такого кода нет");
  if (/need-consent/.test(c)) return t("Нужно подтвердить согласие");
  if (/requires-recent-login/.test(c)) return t("Войдите заново и повторите");
  if (/weak-password/.test(c)) return t("Пароль не короче 6 символов");
  if (/login-taken|email-already/.test(c)) return t("Такой логин уже занят");
  if (/need-word/.test(c)) return t("Введите слово подтверждения");
  if (/need-name/.test(c)) return t("Нужно имя и логин");
  if (/permission-denied/.test(c)) return t("Нет доступа. Войдите заново.");
  if (/network|unavailable/.test(c)) return t("Нет связи с интернетом");
  return t("Не получилось") + (c ? " (" + c + ")" : "");
}
function toast(msg, ms = 2400) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), ms); }
async function run(fn, okMsg) {
  if (ui.busy) return;
  ui.err = ""; ui.busy = true;
  try { await fn(); if (okMsg) toast(t(okMsg)); } catch (e) { ui.err = errText(e); }
  ui.busy = false; render();
}

// ---------- theme ----------
function applyTheme() {
  const r = document.documentElement;
  if (ui.theme === "light" || ui.theme === "dark") r.setAttribute("data-theme", ui.theme); else r.removeAttribute("data-theme");
}
applyTheme();

// ---------- accent ----------
function applyAccent(k) {
  const a = ACCENTS.find(x => x.id === (k ? k.accent : "violet")) || ACCENTS[0], root = document.documentElement, th = root.getAttribute("data-theme");
  const dark = th === "dark" || (th !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.style.setProperty("--accent", dark ? a.d : a.l); root.style.setProperty("--accent-ink", dark ? "#14122B" : "#FFFFFF");
}
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => render()); } catch (e) {}

// ---------- reminders from the schedule ----------
// The next days' reminders are planned on the device with local notifications, so they fire even when the app is closed.
// Times are approximate to within a few minutes (Android may batch alarms to save battery).
const REMINDER_ID_FROM = 3000, REMINDER_ID_TO = 4000;
let reminderHash = "", reminderTimer = null;
function currentReminderPlan() {
  if (!ui.notify || !S.user || !S.ready) return [];
  if (S.role === "kid") { const k = myKid(); return k ? reminderPlan({ role: "kid", kid: k, kids: [k], events: S.events || [] }) : []; }
  if (S.role === "parent") return reminderPlan({ role: "parent", kids: S.kids, events: S.events || [] });
  return [];
}
function syncReminders() {
  clearTimeout(reminderTimer);
  reminderTimer = setTimeout(async () => {
    const plan = currentReminderPlan(), hash = JSON.stringify(plan.map(p => [p.at, p.title, p.x]));
    if (hash === reminderHash) return;
    const L = await localNotifications(); if (!L) return;
    try {
      const pending = await L.getPending(), mine = pending.notifications.filter(n => n.id >= REMINDER_ID_FROM && n.id < REMINDER_ID_TO);
      if (mine.length) await L.cancel({ notifications: mine.map(n => ({ id: n.id })) });
      reminderHash = hash;
      if (!plan.length) return;
      const perm = await L.checkPermissions(); if (perm.display !== "granted") { reminderHash = ""; return; }
      await L.schedule({ notifications: plan.map((p, i) => ({ id: REMINDER_ID_FROM + i, title: tf(p.title, { x: disp(p.x) }), body: p.body || "", schedule: { at: new Date(p.at), allowWhileIdle: true } })) });
    } catch (e) { reminderHash = ""; }
  }, 1500);
}

// ---------- first-run welcome ----------
const HELLO_PARENT_KEY = "talent-foxes-hello-parent", helloKidKey = id => "talent-foxes-hello-kid-" + id;
function maybeHello(k) {
  if (ui.hello || !S.ready || !S.user) return;
  if (S.role === "kid" && k && !LS.get(helloKidKey(k.id))) ui.hello = { role: "kid", kidId: k.id };
  else if (S.role === "parent" && S.family && !LS.get(HELLO_PARENT_KEY)) ui.hello = { role: "parent", step: 0 };
}

// ---------- render ----------
const myKid = () => S.kids[0] || null;
const parentKid = id => S.kids.find(x => x.id === id);
function render() {
  const role = S.role, k = role === "kid" ? myKid() : null;
  applyAccent(k);
  $("#setBtn").textContent = "⚙ " + t("Настройки");
  const sh = $("#sheet"); sh.hidden = !ui.settings; if (ui.settings) sh.innerHTML = ui.settingsPage === "help" ? V.vHelp(S, ui) : V.vSettings(S, ui);
  document.body.style.overflow = ui.settings ? "hidden" : "";
  $("#whoChip").hidden = !S.user;
  $("#whoChip").textContent = role === "kid" ? (k ? k.name : "") : (S.family ? S.family.name : "");
  $("#hdrStars").hidden = !k; if (k) $("#hdrStars").innerHTML = V.STAR + "<span>" + k.stars + "</span>";
  $("#tabsNav").hidden = !k;
  if (k) $("#tabs").innerHTML = V.TABS.map(x => `<button class="tab ${ui.tab === x.id ? "on" : ""}" data-act="tab" data-id="${x.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${x.svg}</svg>${t(x.name)}</button>`).join("");

  const typing = document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName) && $("#view").contains(document.activeElement);
  let html;
  if (!S.ready && !demoState) html = `<div class="muted" style="text-align:center;padding:40px 0">${t("Загрузка…")}</div>`;
  else if (!S.user) html = V.vWelcome(ui);
  else if (role === "parent" && !S.family) html = V.vFamilySetup(S, ui);
  else if (role === "parent") html = V.vParent(S, ui);
  else if (!k) html = `<div class="card result"><h3>${t(S.error ? "Не удалось открыть профиль" : "Загрузка…")}</h3><div class="muted">${S.error ? esc(S.error) : ""}</div></div>`;
  else html = ui.tab === "home" ? V.vHome(k, S.shared) : ui.tab === "tasks" ? V.vTasks(k, ui) : ui.tab === "plan" ? V.vCalendar(k, S) : ui.tab === "wheel" ? V.vWheel(k, ui) : V.vShop(k);
  if (!typing) $("#view").innerHTML = html;
  $("#view").style.cssText = "display:flex;flex-direction:column;gap:16px";
  if (S.user && S.ready) askNotifyPermission();
  maybeHello(k);
  syncReminders();
  const hl = $("#hello"); hl.hidden = !ui.hello;
  if (ui.hello) { hl.innerHTML = V.vHello(ui.hello, k); document.body.style.overflow = "hidden"; }
  $("#sync").textContent = S.user ? t("Данные сохраняются в вашей семье и доступны на других устройствах") : "";
  tick();
}
const esc = V.esc;

// ---------- timer ----------
function beep(times = 3) {
  try { const A = window.AudioContext || window.webkitAudioContext, ctx = new A();
    for (let i = 0; i < times * 2; i++) { const d = i * .28, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = i % 2 ? 660 : 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.25, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .24); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .26); } } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 250]); } catch (e) {}
}
let lock = null;
async function wake(on) { try { if (on && navigator.wakeLock) lock = await navigator.wakeLock.request("screen"); else if (lock) { await lock.release(); lock = null; } } catch (e) {} }

// An alert at the moment the time runs out, so the signal is not lost when the screen is off or the app is in the background.
const TIMER_NOTIFICATION = 1001;
async function localNotifications() {
  if (!Capacitor.isNativePlatform()) return null;
  try { return (await import("@capacitor/local-notifications")).LocalNotifications; } catch (e) { return null; }
}
async function scheduleTimerEnd(ms) {
  const L = await localNotifications(); if (!L || ms <= 0) return;
  try {
    const perm = await L.requestPermissions(); if (perm.display !== "granted") return;
    await L.schedule({ notifications: [{ id: TIMER_NOTIFICATION, title: t("Время вышло!"), body: t("Спидран уборки: таймер закончился"), schedule: { at: new Date(Date.now() + ms), allowWhileIdle: true } }] });
  } catch (e) {}
}
async function cancelTimerEnd() { const L = await localNotifications(); if (L) { try { await L.cancel({ notifications: [{ id: TIMER_NOTIFICATION }] }); } catch (e) {} } }

// ---- notices about new tasks, approvals and requests (no server: they arrive while the app is running) ----
let noticeId = 2000;
async function showNotice(title, body) {
  if (!ui.notify) return;
  if (document.visibilityState === "visible") { toast(title + ". " + body, 6000); try { if (navigator.vibrate) navigator.vibrate(120); } catch (e) {} return; }
  const L = await localNotifications(); if (!L) return;
  try { await L.schedule({ notifications: [{ id: noticeId++, title, body, schedule: { at: new Date(Date.now() + 300), allowWhileIdle: true } }] }); } catch (e) {}
}
setOnEvent(ev => {
  if (ev.type === "logPending") showNotice(tf("{kid}: задание выполнено", { kid: ev.kid }), tf("{x} · +{n} ★, ждёт проверки", { x: disp(ev.title), n: ev.stars }));
  else if (ev.type === "orderPending") showNotice(tf("{kid}: выбрана награда", { kid: ev.kid }), tf("{x} · {n} ★", { x: disp(ev.title), n: ev.cost }));
  else if (ev.type === "taskAssigned") showNotice(t("Новое задание"), tf("{x} · +{n} ★", { x: disp(ev.title), n: ev.stars }));
  else if (ev.type === "approved") showNotice(t("Родители подтвердили"), tf("{x} · +{n} ★", { x: disp(ev.title), n: ev.stars }));
});
// ask for permission once, right after the first sign-in on this device
async function askNotifyPermission() {
  if (LS.get(ASKED_KEY) || !S.user) return; LS.set(ASKED_KEY, "1");
  const L = await localNotifications(); if (L) { try { await L.requestPermissions(); } catch (e) {} }
}

function tick() {
  const r = ui.run; if (!r || r.stage !== "run") return;
  const left = runRemaining(r), arc = $("#ringArc"), tm = $("#ringTime"), ring = document.querySelector(".ring");
  const over = left < 0;
  if (tm) tm.textContent = fmtMs(left);
  if (arc) { arc.style.strokeDashoffset = String(over ? 0 : 276.5 * (1 - Math.max(0, left / r.planned))); arc.style.stroke = over ? "var(--bad)" : "var(--green)"; }
  if (ring) ring.classList.toggle("over", over);
  if (left <= 0 && !r.signalled && !r.paused) { r.signalled = true; beep(); render(); }
}
setInterval(tick, 250);

// ---------- actions ----------
const val = id => { const el = $("#" + id); return el ? el.value : ""; };
const fail = e => { ui.err = errText(e); render(); };
function equipList(k, id) {
  const a = ACCESSORIES.find(x => x.id === id), eq = k.pet.equipped;
  return eq.includes(id) ? eq.filter(x => x !== id) : eq.filter(x => ACCESSORIES.find(y => y.id === x).slot !== a.slot).concat(id);
}
const A = {
  openSettings() { ui.settings = true; render(); },
  closeSettings() { ui.settings = false; ui.settingsPage = null; render(); },
  openHelp() { ui.settingsPage = "help"; render(); },
  closeHelp() { ui.settingsPage = null; render(); },
  helpTab(id) { ui.helpTab = id; render(); },
  helpWho(id) { ui.helpWho = id; render(); },
  helloAgain() { ui.settings = false; ui.settingsPage = null; ui.hello = S.role === "kid" && myKid() ? { role: "kid", kidId: myKid().id } : { role: "parent", step: 0 }; render(); },
  setLang(id) { setLang(id); render(); },
  setNotify(id) { ui.notify = id === "on"; LS.set(NOTIFY_KEY, id); if (ui.notify) { LS.set(ASKED_KEY, ""); askNotifyPermission(); } render(); },
  setTheme(id) { ui.theme = id; LS.set(THEME_KEY, id); applyTheme(); render(); },
  signout() { cancelTimerEnd(); ui.settings = false; ui.settingsPage = null; ui.welcome = "choose"; ui.run = null; ui.pick = null; ui.err = ""; signOutAll().catch(() => {}); },
  welcomeKid() { ui.welcome = "kid"; ui.err = ""; render(); },
  welcomeBack() { ui.welcome = "choose"; ui.err = ""; render(); },
  parentLogin() { run(() => parentSignIn()); },
  kidLogin() {
    ui.kCode = val("kCode"); ui.kLogin = val("kLogin"); const pw = val("kPw");
    run(async () => { await kidSignIn(ui.kCode, ui.kLogin, pw); LS.set("talent-foxes-code", normCode(ui.kCode)); LS.set("talent-foxes-login", ui.kLogin); ui.tab = "home"; });
  },
  createFamily() { const n = val("famName").trim(); if (!n) return fail({ code: "need-name" }); if (!($("#famConsent") || {}).checked) return fail({ code: "need-consent" }); run(() => createFamily(n.slice(0, 30))); },
  joinFamily() { const c = val("joinCode"); if (!($("#famConsent") || {}).checked) return fail({ code: "need-consent" }); run(() => joinFamily(c)); },
  renameFamily() { const n = val("famNameEdit").trim(); if (n) run(() => renameFamily(n.slice(0, 30)), "Сохранено"); },

  // child
  tab(id) { ui.tab = id; render(); window.scrollTo(0, 0); },
  character(id) { const k = myKid(); savePet(k, Object.assign({}, k.pet, { character: id })).catch(fail); },
  color(id) { const k = myKid(); savePet(k, Object.assign({}, k.pet, { color: id })).catch(fail); },
  accent(id) { saveAccent(myKid(), id).catch(fail); },
  submit(id) { const k = myKid(), tk = k.tasks.concat([zoneTask()]).find(x => x.id === id); if (tk) submitTask(k, tk).then(() => toast(t("Отправлено родителям на проверку"))).catch(fail); },
  mins(id) { ui.mins = +id; render(); },
  speedStart() { ui.run = newRun(ui.mins); ui.confirmCancel = false; wake(true); scheduleTimerEnd(ui.run.planned); render(); },
  speedPause() {
    const r = ui.run; if (!r) return;
    if (r.paused) { resumeRun(r); if (runRemaining(r) > 0) scheduleTimerEnd(runRemaining(r)); } else { pauseRun(r); cancelTimerEnd(); }
    render();
  },
  speedFinish() { const r = ui.run; if (!r) return; finishRun(r); ui.confirmCancel = false; wake(false); cancelTimerEnd(); render(); },
  speedCancel() {
    if (ui.run && ui.run.stage === "run" && !ui.confirmCancel) { ui.confirmCancel = true; render(); return; }
    ui.run = null; ui.confirmCancel = false; wake(false); cancelTimerEnd(); render();
  },
  speedSend() {
    const r = ui.run; if (!r) return; ui.run = null;
    submitTask(myKid(), { id: "speed-" + today(), title: "Уборка на время", kind: "clean", stars: 3 }, { speed: speedPayload(r) }).then(() => toast(t("Отправлено родителям на проверку"))).catch(fail); render();
  },
  spin() {
    if (ui.spinning) return; ui.spinning = true; ui.pick = null;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    ui.wheelRot += 360 * 5 + Math.floor(Math.random() * 360);
    const w = $("#wheel"), b = $("#spinBtn"); if (w) w.style.transform = "rotate(" + ui.wheelRot + "deg)"; if (b) b.disabled = true;
    setTimeout(() => { const n = CHALLENGES.length, ang = ((ui.wheelRot % 360) + 360) % 360, idx = Math.floor(((360 - ang) % 360) / (360 / n)) % n; ui.pick = Object.assign({ id: "wheel-" + today() + "-" + idx }, CHALLENGES[idx]); ui.spinning = false; render(); }, reduce ? 50 : 4300);
  },
  submitPick() { if (ui.pick) submitTask(myKid(), ui.pick).then(() => toast(t("Отправлено родителям на проверку"))).catch(fail); },
  buy(id) { const k = myKid(), r = k.rewards.find(x => x.id === id); if (r && k.stars >= r.cost) orderReward(k, r).then(() => toast(t("Заказ отправлен родителям"))).catch(fail); },
  buyAcc(id) { const k = myKid(), a = ACCESSORIES.find(x => x.id === id); if (a && k.stars >= a.cost && !k.pet.owned.includes(id)) buyAccessory(k, a, equipList(k, id)).then(() => toast(t(a.name) + " " + t("теперь твоё!"))).catch(fail); },
  equip(id) { const k = myKid(); savePet(k, Object.assign({}, k.pet, { equipped: equipList(k, id) })).catch(fail); },

  // parent
  pk(id) { ui.pk = id; ui.econPending = null; render(); },
  logOk(id, el) { const k = parentKid(el.dataset.kid), l = k && k.log.find(x => x.id === id); if (l) decideLog(k, l, true).then(() => toast(t("Засчитано!"))).catch(fail); },
  logNo(id, el) { const k = parentKid(el.dataset.kid), l = k && k.log.find(x => x.id === id); if (l) decideLog(k, l, false).catch(fail); },
  orderOk(id, el) { const k = parentKid(el.dataset.kid), o = k && k.orders.find(x => x.id === id); if (o) decideOrder(k, o, "given").catch(fail); },
  orderNo(id, el) { const k = parentKid(el.dataset.kid), o = k && k.orders.find(x => x.id === id); if (o) decideOrder(k, o, "refused").catch(fail); },
  addEvent() {
    const title = val("evTitle").trim(), date = val("evDate"); if (!title || !date) return toast(t("Укажите название и дату"));
    const time = val("evTime"), end = val("evEnd"), who = val("evWho");
    saveEvent({ title: title.slice(0, 60), date, time, end: time ? end : "", repeat: val("evRepeat"), who: who === "all" ? "all" : [who] })
      .then(() => { const el = $("#evTitle"); if (el) el.value = ""; toast(t("Событие добавлено")); }).catch(fail);
  },
  delEvent(id) { deleteEvent(id).catch(fail); },
  ntDay(n) { n = +n; ui.ntDays = ui.ntDays.includes(n) ? ui.ntDays.filter(x => x !== n) : ui.ntDays.concat(n).sort(); keepNewTask(); },
  schedOpen(id) { const k = parentKid(ui.pk), x = k && k.tasks.find(t0 => t0.id === id); if (!x) return; ui.sched = ui.sched && ui.sched.id === id ? null : { id, days: (x.days || []).slice(), time: x.time || "", due: x.due || "" }; render(); },
  schedDay(n) { n = +n; const d = ui.sched.days; ui.sched.days = d.includes(n) ? d.filter(x => x !== n) : d.concat(n).sort(); ui.sched.time = val("schTime"); render(); },
  schedCancel() { ui.sched = null; render(); },
  schedSave() {
    const k = parentKid(ui.pk), sc = ui.sched; if (!k || !sc) return; const time = val("schTime"), due = $("#schDue") ? val("schDue") : "";
    const tasks = k.tasks.map(x => x.id !== sc.id ? x : (() => { const y = Object.assign({}, x, { days: x.repeat === "once" ? [] : sc.days, time, due }); if (!y.time) delete y.time; if (!y.due) delete y.due; if (!y.days.length) delete y.days; return y; })());
    saveTasks(k, tasks).then(() => { ui.sched = null; toast(t("Расписание сохранено")); render(); }).catch(fail);
  },
  helloNext() { if (ui.hello) { ui.hello.step++; render(); } },
  helloDone() { if (ui.hello) { LS.set(ui.hello.role === "kid" ? helloKidKey(ui.hello.kidId) : HELLO_PARENT_KEY, "1"); ui.hello = null; document.body.style.overflow = ""; render(); } },
  dismissAdded() { ui.justAdded = null; render(); },
  packAge(id) { ui.packAge = id; render(); },
  addPackTasks() {
    const k = parentKid(ui.pk); if (!k) return;
    const ids = [...document.querySelectorAll("[data-pack]:checked")].map(x => x.dataset.pack);
    if (!ids.length) return toast(t("Ничего нового не добавлено"));
    addPackTasks(k, ui.packAge, ids).then(n => toast(n ? tf("Добавлено заданий: {n}", { n }) : t("Ничего нового не добавлено"))).catch(fail);
  },
  addPackRewards() { const k = parentKid(ui.pk); if (k) addPackRewards(k, ui.packAge).then(n => toast(n ? tf("Добавлено наград: {n}", { n }) : t("Ничего нового не добавлено"))).catch(fail); },
  repair(id) {
    const k = myKid(), fee = k.log.find(x => x.id === id); if (!fee) return;
    submitTask(k, { id: "repair-" + fee.id, title: "Ремонт: " + fee.repair, kind: "repair", stars: fee.stars }).then(() => toast(t("Отправлено родителям на проверку"))).catch(fail);
  },
  addRule() {
    const v = val("ruTitle").trim(); if (!v) return;
    saveRules(S.shared.rules.concat([{ id: uid(), title: v, cost: Math.max(1, Math.min(FEE_CAP_ONCE, +val("ruCost") || 1)), repair: val("ruRepair").trim() }])).then(() => { ["ruTitle", "ruRepair"].forEach(i => { const el = $("#" + i); if (el) el.value = ""; }); }).catch(fail);
  },
  delRule(id) { saveRules(S.shared.rules.filter(r => r.id !== id)).catch(fail); },
  seedRules() { seedRules().catch(fail); },
  saveGoal() { const c = Math.max(0, Math.min(500, +val("potCost") || 0)); saveGoal(val("potGoal").trim().slice(0, 40), c).then(() => toast(t("Цель сохранена"))).catch(fail); },
  potAdd(n) { adjustPot(+n).then(() => toast(tf("В копилку добавлено {n} ★", { n }))).catch(fail); },
  potReset() { resetPot().then(() => toast(t("Копилка обнулена"))).catch(fail); },
  applyRule() {
    const k = parentKid(ui.pk), r = S.shared.rules.find(x => x.id === (val("applyRule") || ui.ruleId)) || S.shared.rules[0]; if (!k || !r) return;
    applyRule(k, r).then(plan => toast(plan.kind === "fee" ? tf("В копилку ушло {n} ★", { n: plan.amount }) : t("Напоминание отправлено"))).catch(fail);
  },
  ruleUndo(id) { const k = parentKid(ui.pk), l = k && k.log.find(x => x.id === id); if (l) undoRule(k, l).then(() => toast(t("Отменено"))).catch(fail); },
  bonusPick(n) { ui.bonusN = +n; render(); },
  bonusGive() {
    const k = parentKid(ui.pk); if (!k) return; const why = val("bonusWhy").trim().slice(0, 60), n = ui.bonusN;
    giveBonus(k, n, why).then(() => { const el = $("#bonusWhy"); if (el) el.value = ""; toast(tf("Бонус +{n} ★ выдан: {name}", { n, name: k.name })); }).catch(fail);
  },
  bonusUndo(id) { const k = parentKid(ui.pk), l = k && k.log.find(x => x.id === id); if (l) deleteLog(k, l).then(() => toast(t("Бонус отменён"))).catch(fail); },
  econTasks(n) { const k = parentKid(ui.pk); if (k) saveEconomy(k, Object.assign({}, k.economy, { tasksPerDay: +n })).catch(fail); },
  // a new scale is only previewed first; the parent chooses whether existing tasks and rewards follow it
  econMinutes(n) { const k = parentKid(ui.pk); if (!k) return; ui.econPending = +n === k.economy.minutesPerStar ? null : { kid: k.id, n: +n }; render(); },
  econCancel() { ui.econPending = null; render(); },
  econApply() {
    const k = parentKid(ui.pk), p = ui.econPending; if (!k || !p) return;
    saveScale(k, rescaleKid(k, p.n)).then(() => { ui.econPending = null; toast(t("Масштаб звёзд изменён")); render(); }).catch(fail);
  },
  econOnly() {
    const k = parentKid(ui.pk), p = ui.econPending; if (!k || !p) return;
    saveEconomy(k, Object.assign({}, k.economy, { minutesPerStar: p.n })).then(() => { ui.econPending = null; toast(t("Масштаб сохранён для новых заданий")); render(); }).catch(fail);
  },
  addTask() {
    const k = parentKid(ui.pk), v = val("ntTitle").trim(); if (!k || !v) return; const kind = val("ntKind"), min = +val("ntMin") || 0;
    const task = { id: uid(), title: v, kind, stars: Math.max(1, Math.min(10, +val("ntStars") || 1)), icon: kind === "move" ? "🏃" : "🧹", repeat: val("ntRepeat") === "once" ? "once" : "daily" };
    if (min > 0) task.minutes = Math.min(120, Math.round(min));
    if (val("ntTime")) task.time = val("ntTime"); if (val("ntDue") && task.repeat === "once") task.due = val("ntDue");
    if (ui.ntDays.length && task.repeat !== "once") task.days = ui.ntDays.slice();
    saveTasks(k, k.tasks.concat([task])).then(() => { ui.ntDays = []; render(); ["ntTitle", "ntMin"].forEach(i => { const el = $("#" + i); if (el) el.value = ""; }); }).catch(fail);
  },
  delTask(id) { const k = parentKid(ui.pk); if (k) saveTasks(k, k.tasks.filter(x => x.id !== id)).catch(fail); },
  addReward() {
    const k = parentKid(ui.pk), v = val("nrTitle").trim(); if (!k || !v) return;
    saveRewards(k, k.rewards.concat([{ id: uid(), title: v, cost: Math.max(1, Math.min(500, +val("nrCost") || 10)), icon: "🎁" }])).then(() => { const el = $("#nrTitle"); if (el) el.value = ""; }).catch(fail);
  },
  delReward(id) { const k = parentKid(ui.pk); if (k) saveRewards(k, k.rewards.filter(x => x.id !== id)).catch(fail); },
  setPlaylists() {
    const k = parentKid(ui.pk); if (!k) return; const sp = checkUrl(val("plSp"), "spotify"), ym = checkUrl(val("plYm"), "yandex");
    if (sp === null) return toast(t("Нужна ссылка с open.spotify.com")); if (ym === null) return toast(t("Нужна ссылка с music.yandex.ru"));
    savePlaylists(k, { spotify: sp, yandex: ym }).then(() => toast(t("Плейлисты сохранены"))).catch(fail);
  },
  addKid() { const n = val("nkName"), l = val("nkLogin"), p = val("nkPw"), age = val("nkAge"), ok = !!($("#nkConsent") || {}).checked; run(async () => { const id = await addKid(n, l, p, ok, age); ui.pk = id; ui.justAdded = { login: normLogin(l), pw: p }; ["nkName", "nkLogin", "nkPw"].forEach(i => { const el = $("#" + i); if (el) el.value = ""; }); const cb = $("#nkConsent"); if (cb) cb.checked = false; }, "Ребёнок добавлен"); },
  resetPw(id) { const k = parentKid(id), pw = val("rp-" + id); if (k && pw) run(() => resetKidPassword(k, pw), "Пароль сохранён"); },
  delKid(id) {
    if (ui.delKid !== id) { ui.delKid = id; render(); return; }
    const k = parentKid(id), pw = val("delPw-" + id); ui.delKid = null; if (k) run(() => deleteKid(k, pw), "Профиль удалён"); else render();
  },
  delKidCancel() { ui.delKid = null; render(); },
  delStart(stage) { ui.delStage = stage; ui.err = ""; render(); },
  delCancel() { ui.delStage = null; ui.err = ""; render(); },
  deleteFamily() { if (val("delWord").trim().toUpperCase() !== t("УДАЛИТЬ")) return fail({ code: "need-word" }); run(async () => { await deleteFamilyAndAccount(); ui.settings = false; ui.delStage = null; }); },
  leaveFamily() { if (val("delWord").trim().toUpperCase() !== t("УДАЛИТЬ")) return fail({ code: "need-word" }); run(async () => { await leaveFamilyAndDeleteAccount(); ui.settings = false; ui.delStage = null; }); }
};

document.addEventListener("click", e => {
  const pet = e.target.closest("#pet");
  if (pet) { pet.classList.remove("hop"); void pet.getBoundingClientRect(); pet.classList.add("hop"); const k = myKid(), list = SAYS[mood(k)], b = $("#bubble"); if (b) b.textContent = t(list[Math.floor(Math.random() * list.length)]); return; }
  const el = e.target.closest("[data-act]"); if (!el) return;
  const fn = A[el.dataset.act]; if (fn) fn(el.dataset.id, el);
});
// stars follow minutes and difficulty as the parent types; the stars field stays editable
function keepNewTask() {
  const ids = ["ntTitle", "ntKind", "ntRepeat", "ntMin", "ntHard", "ntStars", "ntTime", "ntDue"], saved = {};
  ids.forEach(i => { const el = $("#" + i); if (el) saved[i] = el.value; });
  render(); ids.forEach(i => { const el = $("#" + i); if (el && saved[i] !== undefined) el.value = saved[i]; });
}
function recalcStars() {
  const k = parentKid(ui.pk), m = +val("ntMin"), hint = $("#ntHint"); if (!k || !$("#ntStars")) return;
  if (m > 0) { const n = taskStars(k, m, val("ntHard")); $("#ntStars").value = n; if (hint) hint.textContent = tf("{m} мин, это {n} ★ (1 ★ = {c} мин)", { m, n, c: k.economy.minutesPerStar }); }
  else if (hint) hint.textContent = t("Звёзды считаются сами по минутам и сложности. Их можно поправить вручную.");
}
document.addEventListener("input", e => { if (e.target.id === "ntMin") recalcStars(); });
document.addEventListener("change", e => {
  if (e.target.id === "ntHard") recalcStars();
  if (e.target.id === "applyRule") { ui.ruleId = e.target.value; const k = parentKid(ui.pk), r = S.shared.rules.find(x => x.id === ui.ruleId), box = $("#rulePreview"); if (k && r && box) box.innerHTML = V.rulePreview(k, r); return; }
  const tg = e.target;
  if (tg.id === "petName") { const k = myKid(); savePet(k, Object.assign({}, k.pet, { name: tg.value.trim().slice(0, 14) || "Рыжик" })).catch(fail); }
  else if (tg.id === "nrTier") { if (tg.value) { const c = $("#nrCost"); if (c) c.value = tg.value; } }
  else if (tg.dataset && tg.dataset.kidname) { const k = parentKid(tg.dataset.kidname), v = tg.value.trim(); if (k && v) renameKid(k, v.slice(0, 20)).catch(fail); }
});
// remember which help items are open, so a refresh of the screen does not fold them
document.addEventListener("toggle", e => {
  const el = e.target;
  if (el && el.dataset && el.dataset.qa) { ui.helpTouched = true; if (el.open) ui.helpOpen.add(el.dataset.qa); else ui.helpOpen.delete(el.dataset.qa); }
}, true);
document.addEventListener("keydown", e => { if (e.key === "Enter" && (e.target.id === "kPw")) A.kidLogin(); });

if (demoState) render(); else { render(); start(() => render()); }
