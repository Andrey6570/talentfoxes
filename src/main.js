import "./styles.css";
import { t, getLang, toggleLang } from "./i18n.js";
import * as V from "./views.js";
import { M, start, parentSignIn, signOutAll, kidSignIn, createFamily, joinFamily, renameFamily, addKid, resetKidPassword, deleteKid, renameKid,
  saveTasks, saveRewards, savePlaylists, decideLog, decideOrder, giveBonus, submitTask, orderReward, buyAccessory, savePet, saveAccent } from "./store.js";
import { ACCENTS, ACCESSORIES, CHALLENGES, SAYS, mood, today, zoneTask, checkUrl, normCode, uid } from "./domain.js";

const $ = s => document.querySelector(s);
const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };

const ui = { welcome: "choose", err: "", busy: false, tab: "home", kCode: LS.get("talent-foxes-code") || "", kLogin: LS.get("talent-foxes-login") || "",
  wheelRot: 0, spinning: false, pick: null, mins: 10, run: null, pk: null, delKid: null };
const demoState = window.__demoState; // used by the layout smoke test only
const S = demoState || M;

// ---------- messages ----------
function errText(e) {
  const c = (e && (e.code || e.message)) || "";
  if (/popup-closed|cancel|canceled|12501|user-cancelled/i.test(c)) return "";
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c)) return t("Неверный логин или пароль");
  if (/nologin|no-family|bad-account/.test(c)) return t("Такого ребёнка не нашли. Проверьте код семьи и логин.");
  if (/bad-code/.test(c)) return t("Такого кода нет");
  if (/weak-password/.test(c)) return t("Пароль не короче 6 символов");
  if (/login-taken|email-already/.test(c)) return t("Такой логин уже занят");
  if (/need-name/.test(c)) return t("Нужно имя и логин");
  if (/permission-denied/.test(c)) return t("Нет доступа. Войдите заново.");
  if (/network|unavailable/.test(c)) return t("Нет связи с интернетом");
  return t("Не получилось") + (c ? " (" + c + ")" : "");
}
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2400); }
async function run(fn, okMsg) {
  if (ui.busy) return;
  ui.err = ""; ui.busy = true;
  try { await fn(); if (okMsg) toast(t(okMsg)); } catch (e) { ui.err = errText(e); }
  ui.busy = false; render();
}

// ---------- accent ----------
function applyAccent(k) {
  const a = ACCENTS.find(x => x.id === (k ? k.accent : "violet")) || ACCENTS[0], root = document.documentElement, th = root.getAttribute("data-theme");
  const dark = th === "dark" || (th !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.style.setProperty("--accent", dark ? a.d : a.l); root.style.setProperty("--accent-ink", dark ? "#14122B" : "#FFFFFF");
}
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => render()); } catch (e) {}

// ---------- render ----------
const myKid = () => S.kids[0] || null;
const parentKid = id => S.kids.find(x => x.id === id);
function render() {
  const role = S.role, k = role === "kid" ? myKid() : null;
  applyAccent(k);
  $("#langBtn").textContent = getLang() === "ru" ? "RU" : "EN";
  $("#outBtn").hidden = !S.user; $("#outBtn").textContent = t("Выйти");
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
  else html = ui.tab === "home" ? V.vHome(k) : ui.tab === "tasks" ? V.vTasks(k, ui) : ui.tab === "wheel" ? V.vWheel(k, ui) : V.vShop(k);
  if (!typing) $("#view").innerHTML = html;
  $("#view").style.cssText = "display:flex;flex-direction:column;gap:16px";
  $("#sync").textContent = S.user ? t("Данные сохраняются в вашей семье и доступны на других устройствах") : "";
  tick();
}
const esc = V.esc;

// ---------- timer ----------
function beep() {
  try { const A = window.AudioContext || window.webkitAudioContext, ctx = new A();
    [0, .25, .5].forEach(d => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.2, ctx.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .2); o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .22); }); } catch (e) {}
}
let lock = null;
async function wake(on) { try { if (on && navigator.wakeLock) lock = await navigator.wakeLock.request("screen"); else if (lock) { await lock.release(); lock = null; } } catch (e) {} }
function tick() {
  const r = ui.run; if (!r || r.finished) return;
  const left = Math.max(0, r.end - Date.now()), arc = $("#ringArc"), tm = $("#ringTime");
  if (tm) { const s = Math.ceil(left / 1000); tm.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
  if (arc) arc.style.strokeDashoffset = String(276.5 * (1 - left / r.total));
  if (left <= 0) { r.finished = true; wake(false); beep(); render(); }
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
  lang() { toggleLang(); render(); },
  signout() { ui.welcome = "choose"; ui.run = null; ui.pick = null; ui.err = ""; signOutAll().catch(() => {}); },
  welcomeKid() { ui.welcome = "kid"; ui.err = ""; render(); },
  welcomeBack() { ui.welcome = "choose"; ui.err = ""; render(); },
  parentLogin() { run(() => parentSignIn()); },
  kidLogin() {
    ui.kCode = val("kCode"); ui.kLogin = val("kLogin"); const pw = val("kPw");
    run(async () => { await kidSignIn(ui.kCode, ui.kLogin, pw); LS.set("talent-foxes-code", normCode(ui.kCode)); LS.set("talent-foxes-login", ui.kLogin); ui.tab = "home"; });
  },
  createFamily() { const n = val("famName").trim(); if (!n) return fail({ code: "need-name" }); run(() => createFamily(n.slice(0, 30))); },
  joinFamily() { const c = val("joinCode"); run(() => joinFamily(c)); },
  renameFamily() { const n = val("famNameEdit").trim(); if (n) run(() => renameFamily(n.slice(0, 30)), "Сохранено"); },

  // child
  tab(id) { ui.tab = id; render(); window.scrollTo(0, 0); },
  color(id) { const k = myKid(); savePet(k, Object.assign({}, k.pet, { color: id })).catch(fail); },
  accent(id) { saveAccent(myKid(), id).catch(fail); },
  submit(id) { const k = myKid(), tk = k.tasks.concat([zoneTask()]).find(x => x.id === id); if (tk) submitTask(k, tk).then(() => toast(t("Отправлено родителям на проверку"))).catch(fail); },
  mins(id) { ui.mins = +id; render(); },
  speedStart() { ui.run = { end: Date.now() + ui.mins * 60000, total: ui.mins * 60000, finished: false }; wake(true); render(); },
  speedStop() { ui.run = null; wake(false); render(); },
  speedDone() { ui.run = null; submitTask(myKid(), { id: "speed-" + today(), title: "Уборка на время", kind: "clean", stars: 3 }).then(() => toast(t("Отправлено родителям на проверку"))).catch(fail); render(); },
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
  pk(id) { ui.pk = id; render(); },
  logOk(id, el) { const k = parentKid(el.dataset.kid), l = k && k.log.find(x => x.id === id); if (l) decideLog(k, l, true).then(() => toast(t("Засчитано!"))).catch(fail); },
  logNo(id, el) { const k = parentKid(el.dataset.kid), l = k && k.log.find(x => x.id === id); if (l) decideLog(k, l, false).catch(fail); },
  orderOk(id, el) { const k = parentKid(el.dataset.kid), o = k && k.orders.find(x => x.id === id); if (o) decideOrder(k, o, "given").catch(fail); },
  orderNo(id, el) { const k = parentKid(el.dataset.kid), o = k && k.orders.find(x => x.id === id); if (o) decideOrder(k, o, "refused").catch(fail); },
  bonus(n) { const k = parentKid(ui.pk); if (k) giveBonus(k, +n).then(() => toast(t("Бонус отправлен"))).catch(fail); },
  addTask() {
    const k = parentKid(ui.pk), v = val("ntTitle").trim(); if (!k || !v) return; const kind = val("ntKind");
    saveTasks(k, k.tasks.concat([{ id: uid(), title: v, kind, stars: Math.max(1, Math.min(10, +val("ntStars") || 1)), icon: kind === "move" ? "🏃" : "🧹" }])).then(() => { const el = $("#ntTitle"); if (el) el.value = ""; }).catch(fail);
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
  addKid() { const n = val("nkName"), l = val("nkLogin"), p = val("nkPw"); run(async () => { const id = await addKid(n, l, p); ui.pk = id; ["nkName", "nkLogin", "nkPw"].forEach(i => { const el = $("#" + i); if (el) el.value = ""; }); }, "Ребёнок добавлен"); },
  resetPw(id) { const k = parentKid(id), pw = val("rp-" + id); if (k && pw) run(() => resetKidPassword(k, pw), "Пароль сохранён"); },
  delKid(id) { if (ui.delKid !== id) { ui.delKid = id; render(); return; } ui.delKid = null; const k = parentKid(id); if (k) run(() => deleteKid(k)); }
};

document.addEventListener("click", e => {
  const pet = e.target.closest("#pet");
  if (pet) { pet.classList.remove("hop"); void pet.getBoundingClientRect(); pet.classList.add("hop"); const k = myKid(), list = SAYS[mood(k)], b = $("#bubble"); if (b) b.textContent = t(list[Math.floor(Math.random() * list.length)]); return; }
  const el = e.target.closest("[data-act]"); if (!el) return;
  const fn = A[el.dataset.act]; if (fn) fn(el.dataset.id, el);
});
document.addEventListener("change", e => {
  const tg = e.target;
  if (tg.id === "petName") { const k = myKid(); savePet(k, Object.assign({}, k.pet, { name: tg.value.trim().slice(0, 14) || "Рыжик" })).catch(fail); }
  else if (tg.dataset && tg.dataset.kidname) { const k = parentKid(tg.dataset.kidname), v = tg.value.trim(); if (k && v) renameKid(k, v.slice(0, 20)).catch(fail); }
});
document.addEventListener("keydown", e => { if (e.key === "Enter" && (e.target.id === "kPw")) A.kidLogin(); });

if (demoState) render(); else { render(); start(() => render()); }
