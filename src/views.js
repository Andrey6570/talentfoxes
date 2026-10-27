import { t, tf, pl, disp, getLang, locale, LANGS } from "./i18n.js";
import { LEGAL_URL } from "./config.js";
import { drawPet } from "./characters.js";
import { CHARACTERS, characterOf } from "./characters.js";
import { COLORS, ACCENTS, ACCESSORIES, CHALLENGES, SAYS, level, mood, aliveStreak, doneToday, statusOf, zoneTask, week, today, WEEKDAYS, parseDay, fmtDay, addDays, taskOn, hasSchedule, dayItems, taskGcal, gcalUrl, AGES, PACKS, packTasks, packRewards, runRemaining, runActive, fmtMs, isOnceDone, dailyMinutes, tierPriceAt, planFee, noticesOf, repairOpen, FEE_CAP_ONCE, REPAIR_WINDOW_MS, HARDNESS, TIERS, typicalStars, dailyStars, tierPrice, daysToEarn, priceVerdict } from "./domain.js";

import { esc } from "./util.js";
export { esc };
export const STAR = '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z"/></svg>';
export const STAR_S = STAR.replace('class="st"', 'class="st" width="16" height="16" style="vertical-align:-2px"');
const PLAIN = { id: "x", pet: { color: "fox", equipped: [], owned: [], name: "" }, log: [], lastActive: null };

export const TABS = [
  { id: "home", name: "Питомец", svg: '<circle cx="7" cy="9" r="2.2"/><circle cx="17" cy="9" r="2.2"/><circle cx="4" cy="14" r="2"/><circle cx="20" cy="14" r="2"/><path d="M12 12c-3 0-5 3-5 5.5 0 1.6 1.4 2.5 3 2 1-.3 1.3-.5 2-.5s1 .2 2 .5c1.6.5 3-.4 3-2C17 15 15 12 12 12z"/>' },
  { id: "tasks", name: "Задания", svg: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12.5l3 3 5-6"/>' },
  { id: "plan", name: "Календарь", svg: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>' },
  { id: "wheel", name: "Колесо", svg: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7"/>' },
  { id: "shop", name: "Магазин", svg: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>' }
];

export const legalLinks = () => {
  if (!LEGAL_URL) return "";
  const l = getLang() === "ru" ? "ru" : "en"; // Greek pages are not written yet
  return `<a href="${LEGAL_URL}privacy-${l}.html" target="_blank" rel="noopener noreferrer">${t("Политика конфиденциальности")}</a> · <a href="${LEGAL_URL}terms-${l}.html" target="_blank" rel="noopener noreferrer">${t("Условия использования")}</a>`;
};
const consentBox = (id, text) => `<label class="check"><input type="checkbox" id="${id}"><span>${text}</span></label>`;
const errBox = e => e ? `<div class="err" role="alert">${esc(e)}</div>` : "";

// ---------- signed out ----------
export function vWelcome(ui) {
  const demo = Object.assign({}, PLAIN, { pet: { color: "fox", equipped: ["bow"], owned: [], name: "" }, lastActive: today() });
  if (ui.welcome === "kid") {
    return `<div class="card" style="align-items:stretch"><h2>${t("Вход для ребёнка")}</h2>
      <label class="muted" for="kCode">${t("Код семьи")}</label><input id="kCode" type="text" autocomplete="off" autocapitalize="none" maxlength="12" value="${esc(ui.kCode || "")}" placeholder="abcd2345">
      <label class="muted" for="kLogin">${t("Логин")}</label><input id="kLogin" type="text" autocomplete="username" autocapitalize="none" maxlength="30" value="${esc(ui.kLogin || "")}">
      <label class="muted" for="kPw">${t("Пароль")}</label><input id="kPw" type="password" autocomplete="current-password" maxlength="40">
      ${errBox(ui.err)}
      <div class="row"><button class="btn ghost grow" data-act="welcomeBack">${t("Назад")}</button><button class="btn grow" data-act="kidLogin" ${ui.busy ? "disabled" : ""}>${t("Войти")}</button></div>
      <div class="hint">${t("Код семьи и логин вам скажут родители.")}</div></div>`;
  }
  return `<div class="card petcard" style="padding-block:24px"><div class="stage">${drawPet(demo, "pet", "Talent Foxes")}</div>
      <h2>Talent Foxes</h2><div class="muted">${t("Двигайся, наводи порядок и расти питомца")}</div></div>
    ${errBox(ui.err)}
    <button class="btn" data-act="parentLogin" ${ui.busy ? "disabled" : ""}>${t("Я родитель: войти через Google")}</button>
    <button class="btn ghost" data-act="welcomeKid">${t("Я ребёнок: войти по паролю")}</button>`;
}

export function vFamilySetup(M, ui) {
  return `<div class="card" style="align-items:stretch"><h2>${t("Добро пожаловать!")}</h2><div class="muted">${esc(M.user && M.user.email || "")}</div>${errBox(ui.err)}
      ${consentBox("famConsent", t("Принимаю условия использования и политику конфиденциальности."))}
      <div class="hint">${legalLinks()}</div>
      <h3>${t("Создать семью")}</h3><input id="famName" type="text" maxlength="30" placeholder="${t("Название семьи")}" aria-label="${t("Название семьи")}">
      <button class="btn" data-act="createFamily" ${ui.busy ? "disabled" : ""}>${t("Создать")}</button></div>
    <div class="card" style="align-items:stretch"><h3>${t("Присоединиться к семье")}</h3><div class="muted">${t("Второй родитель вводит код семьи, который показан в кабинете первого.")}</div>
      <input id="joinCode" type="text" autocapitalize="none" maxlength="12" placeholder="abcd2345" aria-label="${t("Код семьи")}">
      <button class="btn ghost" data-act="joinFamily" ${ui.busy ? "disabled" : ""}>${t("Присоединиться")}</button></div>`;
}

// ---------- child ----------
function taskCard(k, tk) {
  const st = statusOf(k, tk.id, tk.repeat);
  const right = st === "done" ? `<div class="state ok">${t("Засчитано")}</div>` : st === "pending" ? `<div class="state wait">${t("Ждёт проверки")}</div>`
    : `<button class="btn small" data-act="submit" data-id="${esc(tk.id)}">${st === "rejected" ? t("Ещё раз") : t("Сделано!")}</button>`;
  return `<div class="task ${tk.kind}"><div class="ic">${esc(tk.icon || "⭐")}</div><div class="grow"><div class="t">${esc(disp(tk.title))}</div><span class="reward-line">${STAR}+${tk.stars}${tk.minutes ? ` · ${tf("≈ {n} мин", { n: tk.minutes })}` : ""}${tk.time ? ` · ${tf("в {x}", { x: tk.time })}` : ""}${tk.due ? ` · ${tf("до {x}", { x: dayLabel(tk.due, false) })}` : ""}${tk.repeat === "once" ? ` · <b class="once">${t("разовое")}</b>` : ""}</span></div>${right}</div>`;
}

export function musicLinks(k) {
  const sp = k.playlists.spotify, ym = k.playlists.yandex, out = [];
  if (sp) out.push(`<a class="btn small sp" href="${esc(sp)}" target="_blank" rel="noopener noreferrer">Spotify</a>`);
  if (ym) out.push(`<a class="btn small ym" href="${esc(ym)}" target="_blank" rel="noopener noreferrer">Яндекс Музыка</a>`);
  return out.join("");
}

// ---------- family pot, rules and messages from the fox ----------
const kindName = kind => t(kind === "move" ? "Движение" : kind === "repair" ? "Ремонт" : "Уборка");

function noticeCard(k, l) {
  if (l.kind === "warn") return `<div class="notice"><b>${t("Напоминание лисёнка")}</b><div>${esc(disp(l.title))}</div><div class="muted">${t("Звёзды не списаны. Если это повторится на этой неделе, в копилку уйдёт взнос.")}</div></div>`;
  const rid = "repair-" + l.id, st = statusOf(k, rid, "once");
  let tail = "";
  if (l.repair) {
    if (st === "done") tail = `<div class="state ok">${t("Ремонт засчитан, звёзды вернулись")}</div>`;
    else if (st === "pending") tail = `<div class="state wait">${t("Ремонт ждёт проверки")}</div>`;
    else if (repairOpen(k, l)) tail = `<div class="muted">${tf("Верни звёзды: {x}. Успей за сутки.", { x: esc(disp(l.repair)) })}</div><button class="btn small" data-act="repair" data-id="${esc(l.id)}">${t("Сделано!")}</button>`;
    else tail = `<div class="muted">${t("Срок ремонта вышел")}</div>`;
  }
  return `<div class="notice"><b>${tf("В копилку ушло {n} ★", { n: l.stars })}</b><div>${esc(disp(l.title))}</div>${tail}</div>`;
}

export function vPotCard(k, shared) {
  const pot = shared.pot, goal = pot.goalCost > 0 && pot.goalTitle;
  const pct = goal ? Math.min(100, Math.round(pot.total / pot.goalCost * 100)) : 0;
  const rules = shared.rules;
  const notes = noticesOf(k).map(l => noticeCard(k, l)).join("");
  return `${notes ? `<div class="card"><h3>${t("Сообщения от лисёнка")}</h3>${notes}</div>` : ""}
    <div class="card"><h3>${t("Семейная копилка")}</h3>
      ${goal ? `<div class="bar xp"><i style="width:${pct}%"></i></div><div class="muted">${tf("{t}: {a} из {b} ★", { t: esc(pot.goalTitle), a: pot.total, b: pot.goalCost })}</div>`
        : `<div class="muted">${tf("В копилке {n} ★. Родители скоро выберут, на что её потратить.", { n: pot.total })}</div>`}
      ${rules.length ? `<div class="muted">${t("Правила семьи")}</div><div class="ladder">${rules.map(r => `<div class="rung"><span>${esc(disp(r.title))}</span><b>${r.cost} ★</b><span></span></div>`).join("")}</div>
        <div class="hint">${t("Первый раз за неделю это только напоминание. Взнос идёт в общую копилку, и его можно вернуть ремонтом.")}</div>` : ""}</div>`;
}

export function vHome(k, shared) {
  const lv = level(k), m = mood(k), sk = aliveStreak(k), says = SAYS[m], say = says[new Date().getDate() % says.length], links = musicLinks(k);
  const label = tf(m === "happy" ? "{pet}, настроение: радостное" : m === "ok" ? "{pet}, настроение: спокойное" : "{pet}, настроение: скучает", { pet: k.pet.name });
  return `<div class="card petcard">
      <div class="stage">${drawPet(k, "pet", label)}</div><div class="bubble" id="bubble">${esc(t(say))}</div>
      <div class="namerow"><input id="petName" type="text" maxlength="14" value="${esc(k.pet.name === "Рыжик" ? t("Рыжик") : k.pet.name)}" aria-label="${t("Имя питомца")}"></div>
      <div class="colors" role="group" aria-label="${t("Цвет питомца")}">${COLORS.map(c => `<button class="dot ${c.id === k.pet.color ? "on" : ""}" style="background:${c.main}" data-act="color" data-id="${c.id}" aria-label="${c.id}"></button>`).join("")}</div>
      <div class="muted">${t("Цвет темы")}</div>
      <div class="accents" role="group" aria-label="${t("Цвет темы")}">${ACCENTS.map(a => `<button class="dot ${a.id === k.accent ? "on" : ""}" style="background:${a.l}" data-act="accent" data-id="${a.id}" aria-label="${t(a.name)}"></button>`).join("")}</div>
      <div class="meters">
        <div class="meter"><div class="mlabel"><span>${t("Энергия")}</span><span>${doneToday(k, "move")}/2</span></div><div class="bar move"><i style="width:${Math.min(1, doneToday(k, "move") / 2) * 100}%"></i></div></div>
        <div class="meter"><div class="mlabel"><span>${t("Уют в комнате")}</span><span>${doneToday(k, "clean")}/2</span></div><div class="bar clean"><i style="width:${Math.min(1, doneToday(k, "clean") / 2) * 100}%"></i></div></div>
      </div></div>
    <div class="card"><h3>${tf("Уровень {n}: {name}", { n: lv.i + 1, name: t(lv.name) })}</h3><div class="bar xp"><i style="width:${lv.pct}%"></i></div>
      <div class="muted">${lv.toNext ? tf("До следующего уровня: {n} {w}", { n: lv.toNext, w: pl(lv.toNext, "звезда|звезды|звёзд", "star|stars") }) : t("Это самый высокий уровень!")}</div>
      <div class="streak"><span class="chip">${tf("🔥 {n} {w} подряд", { n: sk, w: pl(sk, "день|дня|дней", "day|days") })}</span><span class="chip">${tf("❄️ Заморозок: {n}", { n: k.freezes })}</span></div>
      <div class="muted" style="text-align:center">${t("Заморозка спасает серию, если пропустить один день. Новая даётся за каждые 7 дней подряд.")}</div></div>
    <div class="card"><h3>${t("Персонаж")}</h3>
      <div class="chars" role="group" aria-label="${t("Персонаж")}">${CHARACTERS.map(c => `<button class="char ${c.available && c.id === characterOf(k).id ? "on" : ""}" data-act="character" data-id="${c.id}" ${c.available ? "" : "disabled"}><span class="cn">${t(c.name)}</span><span class="cs">${c.available ? (c.id === characterOf(k).id ? t("Выбран") : t("Выбрать")) : t("Скоро")}</span></button>`).join("")}</div></div>
    ${vPotCard(k, shared)}
    <div class="card"><h3>${t("Музыка для дел")}</h3>${links ? `<div class="muted">${t("Включить плейлист:")}</div><div class="music">${links}</div>` : `<div class="muted">${t("Родители ещё не добавили плейлист.")}</div>`}</div>`;
}

function timerHtml(k, ui) {
  const st = statusOf(k, "speed-" + today()), r = ui.run, links = musicLinks(k);
  if (st === "done") return `<h3>${t("Спидран на сегодня засчитан")}</h3><div class="muted">${t("Завтра можно попробовать снова.")}</div>`;
  if (st === "pending") return `<h3>${t("Спидран ждёт проверки")}</h3><div class="muted">${t("Родители скоро посмотрят.")}</div>`;
  if (r && r.stage === "summary") {
    const row = (label, value, cls = "") => `<div class="stat ${cls}"><span>${t(label)}</span><b>${value}</b></div>`;
    return `<h3>${t("Итог спидрана")}</h3><div class="stats">
      ${row("Время уборки без пауз", fmtMs(runActive(r)))}${row("Было на таймере", fmtMs(r.planned))}
      ${r.over > 0 ? row("Сверх времени", "-" + fmtMs(r.over), "bad") : row("Осталось", fmtMs(r.left))}
      ${row("Пауз", r.pauses)}${row("Время на паузах", fmtMs(r.pausedMs))}</div>
      <div class="row" style="flex-wrap:wrap;justify-content:center"><button class="btn" data-act="speedSend">${t("Отправить родителям")}</button><button class="btn ghost" data-act="speedCancel">${t("Не отправлять")}</button></div>`;
  }
  if (r) {
    const left = runRemaining(r), over = left < 0;
    return `<div class="ring ${over ? "over" : ""}"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="var(--surface2)" stroke-width="9"/><circle id="ringArc" cx="50" cy="50" r="44" fill="none" stroke="${over ? "var(--bad)" : "var(--green)"}" stroke-width="9" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><div class="time" id="ringTime">${fmtMs(left)}</div></div>
      ${r.paused ? `<div class="state wait">${t("Пауза")}</div>` : over ? `<div class="state no">${t("Время вышло, таймер идёт в минус")}</div>` : ""}
      ${links ? `<div class="music">${links}</div>` : ""}
      <div class="row" style="flex-wrap:wrap;justify-content:center"><button class="btn ghost" data-act="speedPause">${r.paused ? t("Продолжить") : t("Пауза")}</button><button class="btn" data-act="speedFinish">${t("Выполнено")}</button></div>
      <button class="btn small ghost" data-act="speedCancel">${ui.confirmCancel ? t("Точно отменить?") : t("Отмена")}</button>`;
  }
  return `<h3>${t("Уборка на время")}</h3><div class="muted">${t("Включи свой любимый плейлист и успей убрать комнату до конца таймера.")}</div>
    ${links ? `<div class="music" style="justify-content:center">${links}</div>` : ""}
    <div class="pills">${[5, 10, 15].map(n => `<button class="pill ${ui.mins === n ? "on" : ""}" data-act="mins" data-id="${n}">${tf("{n} мин", { n })}</button>`).join("")}</div>
    <button class="btn" data-act="speedStart">${t("Старт")}</button>`;
}

export function vTasks(k, ui) {
  const open = k.tasks.filter(x => !isOnceDone(k, x) && taskOn(x, today())), mv = open.filter(x => x.kind === "move"), cl = [zoneTask()].concat(open.filter(x => x.kind === "clean"));
  return `<div class="sectionhead"><span class="tag move">${t("Движение")}</span></div>
    <div style="display:flex;flex-direction:column;gap:10px">${mv.map(x => taskCard(k, x)).join("") || `<div class="muted">${t("Заданий пока нет")}</div>`}</div>
    <div class="sectionhead" style="margin-top:8px"><span class="tag clean">${t("Уборка")}</span></div>
    <div style="display:flex;flex-direction:column;gap:10px">${cl.map(x => taskCard(k, x)).join("")}</div>
    <div class="sectionhead" style="margin-top:8px"><span class="tag clean">${t("Спидран")}</span></div>
    <div class="card timer" id="timerCard">${timerHtml(k, ui)}</div>`;
}

export function vWheel(k, ui) {
  const n = CHALLENGES.length, step = 360 / n, R = 150, cx = 160, cy = 160; let segs = "", labels = "";
  CHALLENGES.forEach((c, i) => {
    const a0 = (i * step - 90) * Math.PI / 180, a1 = ((i + 1) * step - 90) * Math.PI / 180, rad = ((i + .5) * step - 90) * Math.PI / 180;
    const p = (a, r) => (cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1);
    segs += `<path d="M${cx} ${cy} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} Z" fill="${c.color}" stroke="#fff" stroke-width="3"/>`;
    labels += `<text x="${(cx + 102 * Math.cos(rad)).toFixed(1)}" y="${(cy + 102 * Math.sin(rad) + 11).toFixed(1)}" font-size="32" text-anchor="middle">${c.icon}</text>`;
  });
  const pk = ui.pick;
  const result = pk ? `<div class="card result"><div class="big">${pk.icon}</div><h3>${esc(t(pk.title))}</h3><span class="reward-line">${STAR}+${pk.stars}</span>${
    statusOf(k, pk.id) === "pending" ? `<div class="state wait">${t("Ждёт проверки")}</div>` : statusOf(k, pk.id) === "done" ? `<div class="state ok">${t("Засчитано")}</div>` : `<button class="btn" data-act="submitPick">${t("Готово!")}</button>`}</div>`
    : `<div class="card result"><h3>${t("Крути колесо")}</h3><div class="muted">${t("Выпадет случайное задание. Если не нравится, крути ещё раз.")}</div></div>`;
  return `<h2>${t("Колесо заданий")}</h2><div class="wheelbox"><div class="pointer"></div><svg viewBox="0 0 320 320" aria-hidden="true"><g id="wheel" style="transform:rotate(${ui.wheelRot}deg)">${segs}${labels}<circle cx="160" cy="160" r="22" fill="#fff" stroke="#ddd" stroke-width="2"/></g></svg></div>
    <button class="btn" data-act="spin" id="spinBtn" ${ui.spinning ? "disabled" : ""}>${t("Крутить!")}</button>${result}`;
}

export function vShop(k) {
  const rw = k.rewards.map(r => `<div class="item"><div class="emo">${esc(r.icon || "🎁")}</div><div class="nm">${esc(t(r.title))}</div><button class="btn small" data-act="buy" data-id="${esc(r.id)}" ${k.stars < r.cost ? "disabled" : ""}>${r.cost} ${STAR_S}</button></div>`).join("");
  const ac = ACCESSORIES.map(a => {
    const own = k.pet.owned.includes(a.id), on = k.pet.equipped.includes(a.id);
    const btn = own ? `<button class="btn small ${on ? "" : "ghost"}" data-act="equip" data-id="${a.id}">${on ? t("Снять") : t("Надеть")}</button>` : `<button class="btn small" data-act="buyAcc" data-id="${a.id}" ${k.stars < a.cost ? "disabled" : ""}>${a.cost} ${STAR_S}</button>`;
    return `<div class="item"><div class="emo">${a.emo}</div><div class="nm">${t(a.name)}</div>${btn}</div>`;
  }).join("");
  const mine = k.orders.filter(o => o.status === "pending" && o.kind === "reward");
  return `<h2>${t("Награды от родителей")}</h2>${mine.length ? `<div class="card"><h3>${t("Ждут выдачи")}</h3>${mine.map(o => `<div>${esc(o.icon || "🎁")} ${esc(t(o.title))}</div>`).join("")}</div>` : ""}
    <div class="grid2">${rw}</div><h2 style="margin-top:8px">${t("Гардероб питомца")}</h2><div class="grid2">${ac}</div>`;
}

// ---------- calendar ----------
const tzName = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) { return ""; } };
export function dayLabel(day, withRelative = true) {
  const l = locale(), d = parseDay(day), now = fmtDay(new Date());
  const base = new Intl.DateTimeFormat(l, { weekday: "short", day: "numeric", month: "short" }).format(d);
  if (!withRelative) return base;
  return day === now ? t("Сегодня") + ", " + base : day === addDays(now, 1) ? t("Завтра") + ", " + base : base;
}
const gcalLink = (href, label) => `<a class="btn small ghost" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
function agendaRows(items, parentView) {
  return items.map(x => `<div class="pending agenda"><div class="grow"><div>${x.time ? `<b class="when">${esc(x.time)}${x.end ? "–" + esc(x.end) : ""}</b> ` : ""}${x.type === "task" ? "✅ " : ""}${esc(disp(x.title))}${x.who ? ` <span class="kidtag">${esc(x.who)}</span>` : ""}</div>
      ${x.type === "event" && x.ev.repeat !== "none" && x.ev.repeat ? `<div class="muted">${t(x.ev.repeat === "weekly" ? "каждую неделю" : "каждый год")}</div>` : ""}</div>
      ${parentView && x.type === "event" ? gcalLink(gcalUrl({ title: x.title, day: x.ev.date, time: x.ev.time, end: x.ev.end, repeat: x.ev.repeat }, tzName()), t("В Google Календарь")) : ""}
      ${parentView && x.type === "event" ? `<button class="nobtn" data-act="delEvent" data-id="${esc(x.id)}" aria-label="${t("Удалить")}">🗑</button>` : ""}</div>`).join("");
}
export function vCalendar(k, S) {
  const today0 = fmtDay(new Date()), days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(today0, i));
  const blocks = days.map(day => { const items = dayItems(day, S.events || [], [k], k); return `<div class="card"><h3>${dayLabel(day)}</h3>${items.length ? agendaRows(items, false) : `<div class="muted">${t("Ничего не запланировано")}</div>`}</div>`; });
  return `<h2>${t("Календарь")}</h2>${blocks.join("")}`;
}
export function calCard(S, ui) {
  const today0 = fmtDay(new Date()), days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(today0, i)), kids = S.kids, events = S.events || [];
  const week = days.map(day => { const items = dayItems(day, events, kids); return `<div><h3 style="font-size:15px">${dayLabel(day)}</h3>${items.length ? agendaRows(items, true) : `<div class="muted">${t("Ничего не запланировано")}</div>`}</div>`; }).join("");
  return `<div class="card"><h3>${t("Семейный календарь")}</h3>
      <div class="muted">${t("Здесь события семьи и задания по расписанию. Напоминания приходят на телефоны за 10 минут до начала.")}</div>${week}
      <h3 style="margin-top:6px">${t("Новое событие")}</h3>
      <div class="formrow"><input class="full" type="text" id="evTitle" maxlength="60" placeholder="${t("Название события")}" aria-label="${t("Название события")}">
        <input type="date" id="evDate" value="${today0}" aria-label="${t("Дата")}">
        <select id="evRepeat" aria-label="${t("Повтор")}"><option value="none">${t("Один раз")}</option><option value="weekly">${t("Каждую неделю")}</option><option value="yearly">${t("Каждый год")}</option></select>
        <input type="time" id="evTime" aria-label="${t("Начало")}"><input type="time" id="evEnd" aria-label="${t("Конец")}">
        <select id="evWho" class="full" aria-label="${t("Для кого")}"><option value="all">${t("Для всей семьи")}</option>${kids.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select>
        <div class="hint full">${t("Без времени событие считается на весь день.")}</div>
        <button class="btn small full" data-act="addEvent">${t("Добавить событие")}</button></div></div>`;
}
// schedule editor for one task in the parents' list
function schedLabel(x) {
  const parts = [];
  if (x.days && x.days.length && x.days.length < 7) parts.push(x.days.map(d => t(WEEKDAYS[d - 1])).join(" "));
  if (x.time) parts.push(x.time); if (x.due) parts.push(tf("до {x}", { x: dayLabel(x.due, false) }));
  return parts.join(" · ");
}
const dayChips = (sel, act) => `<div class="pills" style="justify-content:flex-start" role="group" aria-label="${t("Дни недели")}">${WEEKDAYS.map((d, i) => `<button class="pill ${sel.includes(i + 1) ? "on" : ""}" data-act="${act}" data-id="${i + 1}">${t(d)}</button>`).join("")}</div>`;
function taskRow(k, x, ui) {
  const open = ui.sched && ui.sched.id === x.id, sc = schedLabel(x);
  const editor = open ? `<div class="notice" style="width:100%"><b>${t("Расписание")}</b>${x.repeat === "once" ? `<label class="muted" for="schDue">${t("Срок")}</label><input type="date" id="schDue" value="${esc(ui.sched.due || "")}">` : `<div class="muted">${t("Дни недели (если не отмечено, то каждый день)")}</div>${dayChips(ui.sched.days, "schedDay")}`}
      <label class="muted" for="schTime">${t("Время напоминания")}</label><input type="time" id="schTime" value="${esc(ui.sched.time || "")}">
      <div class="row" style="flex-wrap:wrap"><button class="btn small" data-act="schedSave">${t("Сохранить")}</button><button class="btn small ghost" data-act="schedCancel">${t("Отмена")}</button>${gcalLink(taskGcal(Object.assign({}, x, { days: ui.sched.days, time: ui.sched.time || x.time }), fmtDay(new Date()), tzName()), t("В Google Календарь"))}</div></div>` : "";
  return `<div class="pending" style="flex-wrap:wrap"><div class="grow">${esc(x.icon || "")} ${esc(disp(x.title))}<div class="muted">${tf(x.kind === "move" ? "Движение · {n}★" : "Уборка · {n}★", { n: x.stars })}${x.minutes ? " · " + tf("≈ {n} мин", { n: x.minutes }) : ""} · ${t(x.repeat === "once" ? (isOnceDone(k, x) ? "разовое, выполнено" : "разовое") : "каждый день")}${sc ? " · " + sc : ""}</div></div>
    <button class="btn small ghost" data-act="schedOpen" data-id="${esc(x.id)}" aria-label="${t("Расписание")}">🕒</button><button class="nobtn" data-act="delTask" data-id="${esc(x.id)}" aria-label="${t("Удалить")}">🗑</button>${editor}</div>`;
}

// ---------- parent cabinet ----------
export function rulePreview(k, rule) {
  if (!rule) return "";
  const plan = planFee(k, rule);
  if (plan.kind === "warn") {
    const why = plan.why === "first" ? "Первый раз за неделю: только напоминание, звёзды не списываются." : plan.why === "empty" ? "У ребёнка нет звёзд: будет только напоминание." : "Недельный потолок взносов исчерпан: будет только напоминание.";
    return `<b>${t("Напоминание")}</b><div class="muted">${t(why)}</div>`;
  }
  return `<b>${tf("Взнос {n} ★ в семейную копилку", { n: plan.amount })}</b><div class="muted">${plan.capped ? t("Сумма уменьшена из-за потолка. ") : ""}${rule.repair ? tf("Ребёнок сможет вернуть звёзды ремонтом: {x}", { x: esc(disp(rule.repair)) }) : t("Ремонта у этого правила нет.")}</div>`;
}
function rewardNote(k, cost) {
  const d = daysToEarn(k, cost), v = priceVerdict(k, cost);
  const days = d < 1.5 ? t("≈ 1 дня заработка") : tf("≈ {n} дн. заработка", { n: Math.round(d) });
  const flag = v === "cheap" ? ` · <b class="flag">${t("дешевле одного дня")}</b>` : v === "dear" ? ` · <b class="flag">${t("очень дорого")}</b>` : "";
  return `${cost}★ · ${days}${flag}`;
}
export function vParent(M, ui) {
  const kids = M.kids, fam = M.family;
  const pendLogs = [], pendOrders = [];
  kids.forEach(x => {
    x.log.filter(l => l.status === "pending").forEach(l => pendLogs.push({ k: x, l }));
    x.orders.filter(o => o.status === "pending").forEach(o => pendOrders.push({ k: x, o }));
  });
  const tag = x => `<span class="kidtag">${esc(x.name)}</span> `;
  const speedNote = l => l.speed ? `<div class="muted">${tf("Спидран: {a} из {p}, пауз {n} ({m}){o}", { a: fmtMs(l.speed.active), p: fmtMs(l.speed.planned), n: l.speed.pauses, m: fmtMs(l.speed.pausedMs), o: l.speed.over > 0 ? tf(", сверх времени -{x}", { x: fmtMs(l.speed.over) }) : "" })}</div>` : "";
  const pending = `<div class="card"><h3>${t("Нужно подтвердить")}</h3>${pendLogs.length || pendOrders.length ? "" : `<div class="muted">${t("Пока ничего нет")}</div>`}
    ${pendLogs.map(({ k: x, l }) => `<div class="pending"><div class="grow"><div>${tag(x)}${esc(disp(l.title))}</div><div class="muted">${tf("{k} · +{n} {w}", { k: kindName(l.kind), n: l.stars, w: pl(l.stars, "звезда|звезды|звёзд", "star|stars") })}</div>${speedNote(l)}</div><button class="nobtn" data-act="logNo" data-kid="${x.id}" data-id="${l.id}" aria-label="${t("Не засчитать")}">✕</button><button class="okbtn" data-act="logOk" data-kid="${x.id}" data-id="${l.id}" aria-label="${t("Засчитать")}">✓</button></div>`).join("")}
    ${pendOrders.map(({ k: x, o }) => `<div class="pending"><div class="grow"><div>${tag(x)}${esc(o.icon || "🎁")} ${esc(t(o.title))}</div><div class="muted">${tf("Награда за {n} {w}", { n: o.cost, w: pl(o.cost, "звезду|звезды|звёзд", "star|stars") })}</div></div><button class="nobtn" data-act="orderNo" data-kid="${x.id}" data-id="${o.id}" aria-label="${t("Вернуть звёзды")}">↩</button><button class="okbtn" data-act="orderOk" data-kid="${x.id}" data-id="${o.id}" aria-label="${t("Выдано")}">✓</button></div>`).join("")}</div>`;

  const family = `<div class="card"><h3>${t("Семья")}</h3>
      <div class="pwrow"><input type="text" id="famNameEdit" maxlength="30" value="${esc(fam.name)}" aria-label="${t("Название семьи")}"><button class="btn small" data-act="renameFamily">${t("Сохранить")}</button></div>
      <div class="muted">${t("Код семьи")}</div><div class="code" id="famCode">${esc(fam.inviteCode)}</div>
      <div class="hint">${t("Этот код нужен ребёнку для входа и второму родителю для присоединения.")}</div>
      <div class="hint">${tf("Родителей в семье: {n} из 2", { n: (fam.parentUids || []).length })}</div></div>`;

  const sh = M.shared;
  const famRules = `<div class="card"><h3>${t("Правила семьи")}</h3>
      <div class="muted">${t("Составьте правила вместе с ребёнком. Цена каждого известна заранее, а взнос идёт в семейную копилку, а не пропадает.")}</div>
      ${sh.rules.map(r => `<div class="pending"><div class="grow">${esc(disp(r.title))}<div class="muted">${tf("Взнос {n} ★", { n: r.cost })}${r.repair ? " · " + tf("ремонт: {x}", { x: esc(disp(r.repair)) }) : ""}</div></div><button class="nobtn" data-act="delRule" data-id="${esc(r.id)}" aria-label="${t("Удалить")}">🗑</button></div>`).join("")}
      ${sh.rulesSaved ? "" : `<button class="btn small ghost" data-act="seedRules">${t("Добавить примеры правил")}</button>`}
      <div class="formrow"><input class="full" type="text" id="ruTitle" maxlength="60" placeholder="${t("Новое правило")}" aria-label="${t("Новое правило")}">
        <input type="number" id="ruCost" min="1" max="${FEE_CAP_ONCE}" value="1" aria-label="${t("Взнос в звёздах")}">
        <input type="text" id="ruRepair" maxlength="60" placeholder="${t("Ремонт (необязательно)")}" aria-label="${t("Ремонт")}">
        <button class="btn small full" data-act="addRule">${t("Добавить правило")}</button></div>
      <div class="hint">${tf("Не больше {n} ★ за раз и не больше 20% от заработка ребёнка за неделю. Баланс не уходит ниже нуля.", { n: FEE_CAP_ONCE })}</div></div>
    <div class="card"><h3>${t("Семейная копилка")}</h3>
      <div class="econ"><b>${tf("В копилке: {n} ★", { n: sh.pot.total })}</b></div>
      <div class="formrow"><input class="full" type="text" id="potGoal" maxlength="40" value="${esc(sh.pot.goalTitle)}" placeholder="${t("На что копим, например пицца-вечер")}" aria-label="${t("Цель копилки")}">
        <input type="number" id="potCost" min="1" max="500" value="${sh.pot.goalCost || ""}" placeholder="${t("Цена в ★")}" aria-label="${t("Цена цели")}">
        <button class="btn small" data-act="saveGoal">${t("Сохранить цель")}</button></div>
      <div class="row" style="flex-wrap:wrap"><button class="btn small ghost" data-act="potAdd" data-id="1">+1 ★</button><button class="btn small ghost" data-act="potAdd" data-id="5">+5 ★</button>
        ${sh.pot.total > 0 ? `<button class="btn small ghost" data-act="potReset">${t("Потратили, обнулить")}</button>` : ""}</div>
      <div class="hint">${t("Родители тоже могут пополнять копилку.")}</div></div>`;

  const added = ui.justAdded ? `<div class="card"><h3>${t("Данные для входа ребёнка")}</h3>
      <div class="muted">${t("Покажите их ребёнку или отправьте. Пароль виден только сейчас.")}</div>
      <div class="stats"><div class="stat"><span>${t("Код семьи")}</span><b>${esc(fam.inviteCode)}</b></div><div class="stat"><span>${t("Логин")}</span><b>${esc(ui.justAdded.login)}</b></div><div class="stat"><span>${t("Пароль")}</span><b>${esc(ui.justAdded.pw)}</b></div></div>
      <button class="btn small ghost" data-act="dismissAdded">${t("Скрыть")}</button></div>` : "";
  const start = !kids.length ? `<div class="card"><h3>${t("Начало работы")}</h3><ol class="steps"><li>${t("Добавьте ребёнка и выберите его возраст")}</li><li>${t("Передайте ему код семьи, логин и пароль")}</li><li>${t("Загляните в «Экономика звёзд» и настройте цены")}</li></ol></div>` : "";
  const kidList = `<div class="card"><h3>${t("Дети")}</h3>
      ${kids.length ? "" : `<div class="muted">${t("Добавьте первого ребёнка")}</div>`}
      ${kids.map(x => `<div style="display:flex;flex-direction:column;gap:8px;padding-top:10px;border-top:1px solid var(--line)">
        <div class="pwrow"><input type="text" maxlength="20" value="${esc(x.name)}" data-kidname="${x.id}" aria-label="${t("Имя ребёнка")}">${ui.delKid === x.id ? `<span></span>` : `<button class="nobtn" data-act="delKid" data-id="${x.id}" aria-label="${t("Удалить")}">🗑</button>`}</div>
        <div class="muted">${t("Логин")}: <b>${esc(x.login)}</b></div>
        ${ui.delKid === x.id ? `<div class="notice"><b>${t("Удалить профиль и все данные ребёнка?")}</b><div class="muted">${t("Задания, звёзды и настройки будут удалены. Чтобы удалить и вход ребёнка, введите его пароль. Можно оставить пустым.")}</div>
          <input type="password" id="delPw-${x.id}" autocomplete="off" placeholder="${t("Пароль ребёнка (необязательно)")}" aria-label="${t("Пароль ребёнка")}">
          <div class="row" style="flex-wrap:wrap"><button class="btn small danger" data-act="delKid" data-id="${x.id}">${t("Удалить навсегда")}</button><button class="btn small ghost" data-act="delKidCancel">${t("Отмена")}</button></div></div>` : ""}
        <div class="pwrow"><input type="text" id="rp-${x.id}" autocomplete="off" maxlength="40" placeholder="${t("Новый пароль, от 6 символов")}" aria-label="${t("Новый пароль ребёнка")}"><button class="btn small" data-act="resetPw" data-id="${x.id}">${t("Сменить")}</button></div></div>`).join("")}
      <h3 style="margin-top:6px">${t("Добавить ребёнка")}</h3>
      <div class="formrow"><input class="full" type="text" id="nkName" maxlength="20" placeholder="${t("Имя")}" aria-label="${t("Имя")}">
        <input type="text" id="nkLogin" autocapitalize="none" maxlength="20" placeholder="${t("Логин латиницей")}" aria-label="${t("Логин")}">
        <input type="text" id="nkPw" autocomplete="off" maxlength="40" placeholder="${t("Пароль, от 6 символов")}" aria-label="${t("Пароль")}">
        <select id="nkAge" class="full" aria-label="${t("Возраст ребёнка")}">${AGES.map(a => `<option value="${a.id}" ${a.id === "a8" ? "selected" : ""}>${t(a.name)}</option>`).join("")}<option value="none">${t("Без набора")}</option></select>
        <div class="hint full">${t("Стартовые задания и награды подберутся по возрасту. Потом всё можно поменять.")}</div>
        <div class="full">${consentBox("nkConsent", t("Подтверждаю, что я родитель или законный представитель ребёнка, и даю согласие на обработку его данных по политике конфиденциальности."))}<div class="hint">${legalLinks()}</div></div>
        <button class="btn small full" data-act="addKid" ${ui.busy ? "disabled" : ""}>${t("Добавить ребёнка")}</button></div></div>`;

  if (!kids.length) return `${errBox(ui.err)}${start}${kidList}${pending}${calCard(M, ui)}${famRules}${family}`;

  if (!kids.find(x => x.id === ui.pk)) ui.pk = kids[0].id;
  const k = kids.find(x => x.id === ui.pk), wk = week(k), max = Math.max(1, ...wk.map(d => d.move + d.clean));
  const pend = ui.econPending && ui.econPending.kid === k.id && ui.econPending.n !== k.economy.minutesPerStar ? ui.econPending.n : 0;
  const settings = `${kids.length > 1 ? `<div class="muted">${t("Для кого настраиваем:")}</div>` : ""}
    <div class="pk" role="group">${kids.map(x => `<button class="pill ${x.id === k.id ? "on" : ""}" data-act="pk" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>
    <div class="card"><h3>${t("Бонус за старание")}</h3>
      <div class="muted">${t("Бонус сразу попадает на счёт ребёнка, без подтверждения. Например, за уборку без напоминания.")}</div>
      <div class="pills" style="justify-content:flex-start" role="group">${[1, 3, 5, 10].map(n => `<button class="pill ${ui.bonusN === n ? "on" : ""}" data-act="bonusPick" data-id="${n}">+${n} ★</button>`).join("")}</div>
      <input type="text" id="bonusWhy" maxlength="60" placeholder="${t("За что? (необязательно)")}" aria-label="${t("За что бонус")}">
      <button class="btn" data-act="bonusGive">${tf("Выдать +{n} ★ ({name})", { name: k.name, n: ui.bonusN })}</button>
      ${k.log.filter(l => l.kind === "bonus").sort((a, b) => b.ts - a.ts).slice(0, 3).map(l => `<div class="pending"><div class="grow">+${l.stars} ★ · ${esc(disp(l.title))}<div class="muted">${esc(l.day)}</div></div><button class="btn small ghost" data-act="bonusUndo" data-id="${l.id}">${t("Отменить")}</button></div>`).join("")}</div>
    <div class="card"><h3>${t("Применить правило")}</h3>
      ${sh.rules.length ? `<select id="applyRule" aria-label="${t("Правило")}">${sh.rules.map(r => `<option value="${esc(r.id)}" ${r.id === ui.ruleId ? "selected" : ""}>${esc(disp(r.title))} · ${r.cost} ★</option>`).join("")}</select>
      <div class="econ" id="rulePreview">${rulePreview(k, sh.rules.find(r => r.id === ui.ruleId) || sh.rules[0])}</div>
      <button class="btn" data-act="applyRule">${tf("Применить ({name})", { name: k.name })}</button>` : `<div class="muted">${t("Сначала добавьте правила семьи ниже.")}</div>`}
      ${k.log.filter(l => l.kind === "fee" || l.kind === "warn").sort((a, b) => b.ts - a.ts).slice(0, 3).map(l => `<div class="pending"><div class="grow">${l.kind === "fee" ? tf("Взнос {n} ★", { n: l.stars }) : t("Напоминание")} · ${esc(disp(l.title))}<div class="muted">${esc(l.day)}</div></div>${l.kind === "fee" && k.log.some(x => x.taskId === "repair-" + l.id && x.status === "done") ? "" : `<button class="btn small ghost" data-act="ruleUndo" data-id="${l.id}">${t("Отменить")}</button>`}</div>`).join("")}</div>
    <div class="card"><h3>${t("Последние 7 дней")}</h3>
      <div class="chart">${wk.map(d => { const tot = d.move + d.clean; return `<div class="col"><span>${tot || ""}</span><div class="stack" style="height:${Math.round(tot / max * 90)}px"><i style="height:${tot ? d.move / tot * 100 : 0}%;background:var(--move)"></i><i style="height:${tot ? d.clean / tot * 100 : 0}%;background:var(--clean)"></i></div><span class="muted">${t(d.wd)}</span></div>`; }).join("")}</div>
      <div class="legend"><span><b style="background:var(--move)"></b>${t("Движение")}</span><span><b style="background:var(--clean)"></b>${t("Уборка")}</span></div>
      <div class="muted">${tf("Подтверждённых заданий в день. Всего звёзд заработано: {n}.", { n: k.total })} ${tf("Сейчас на счёте: {n}.", { n: k.stars })}</div></div>
    <div class="card"><h3>${t("Экономика звёзд")}</h3>
      <div class="muted">${t("Сколько заданий в день вы ждёте от ребёнка?")}</div>
      <div class="pills" style="justify-content:flex-start">${[...new Set([2, 4, 6, 8, 10, k.economy.tasksPerDay])].sort((a, b) => a - b).map(n => `<button class="pill ${k.economy.tasksPerDay === n ? "on" : ""}" data-act="econTasks" data-id="${n}">${n}</button>`).join("")}</div>
      <div class="muted">${t("1 звезда — это примерно столько минут усилий:")}</div>
      <div class="pills" style="justify-content:flex-start">${[5, 10, 15].map(n => `<button class="pill ${(pend ? pend : k.economy.minutesPerStar) === n ? "on" : ""}" data-act="econMinutes" data-id="${n}">${tf("{n} мин", { n })}</button>`).join("")}</div>
      ${pend ? `<div class="notice" style="width:100%"><b>${tf("Новый масштаб: 1 ★ = {n} мин", { n: pend })}</b>
        <div class="muted">${tf("Звёзды всех заданий и цены наград изменятся в ×{f}. Уже заработанные звёзды на счёте не пересчитываются.", { f: Math.round(k.economy.minutesPerStar / pend * 100) / 100 })}</div>
        <div class="muted">${t("Предпросмотр цен наград:")}</div>
        <div class="ladder" style="width:100%">${TIERS.map(x => `<div class="rung"><span>${t(x.name)}</span><b>${tierPriceAt(k, x, k.economy.minutesPerStar / pend)} ★</b><span class="muted">${tf("≈ {n} дн.", { n: x.days })}</span></div>`).join("")}</div>
        <div class="row" style="flex-wrap:wrap"><button class="btn small" data-act="econApply">${t("Пересчитать задания и награды")}</button><button class="btn small ghost" data-act="econOnly">${t("Только для новых заданий")}</button><button class="btn small ghost" data-act="econCancel">${t("Отмена")}</button></div></div>` : ""}
      <div class="econ"><b>${tf("≈ {d} ★ в день, ≈ {w} ★ в неделю", { d: Math.round(dailyStars(k) * 10) / 10, w: Math.round(dailyStars(k) * 7) })}</b><div class="muted">${tf("Это примерно {n} мин усилий в день", { n: Math.round(dailyMinutes(k) / 5) * 5 })}</div></div>
      <div class="muted">${t("Ориентир цен на награды:")}</div>
      <div class="ladder">${TIERS.map(x => `<div class="rung"><span>${t(x.name)}</span><b>${tierPrice(k, x)} ★</b><span class="muted">${tf("≈ {n} дн.", { n: x.days })}</span></div>`).join("")}</div>
      <div class="hint">${tf("Расчёт: {n} {w} в день × типичные {s} ★ × 70% (ребёнок делает не всё).", { n: k.economy.tasksPerDay, w: pl(k.economy.tasksPerDay, "задание|задания|заданий", "task|tasks"), s: Math.round(typicalStars(k) * 10) / 10 })}</div></div>
    <div class="card"><h3>${t("Готовые наборы заданий")}</h3>
      <div class="muted">${t("Звёзды подобраны по минутам и по настройкам экономики этого ребёнка. Галочками отметьте, что добавить.")}</div>
      <div class="pills" style="justify-content:flex-start" role="group" aria-label="${t("Возраст")}">${AGES.map(a => `<button class="pill ${ui.packAge === a.id ? "on" : ""}" data-act="packAge" data-id="${a.id}">${t(a.name)}</button>`).join("")}</div>
      <div>${packTasks(ui.packAge, k.economy).map(p => { const have = k.tasks.some(x => x.id === p.id); return `<label class="check packrow"><input type="checkbox" data-pack="${p.id}" ${p.sel && !have ? "checked" : ""} ${have ? "disabled" : ""}><span class="grow">${esc(p.icon)} ${esc(disp(p.title))}<span class="muted"> · ${tf("≈ {n} мин", { n: p.minutes })} · ${p.stars} ★${have ? " · " + t("уже добавлено") : ""}</span></span></label>`; }).join("")}</div>
      <button class="btn small" data-act="addPackTasks">${t("Добавить выбранные задания")}</button>
      <h3 style="margin-top:6px">${t("Готовые награды")}</h3>
      <div class="muted">${t("Цены считаются от заработка ребёнка: мелкое примерно 2 дня, среднее неделя, крупное месяц.")}</div>
      <div class="ladder">${packRewards(k, ui.packAge).map(r => `<div class="rung"><span>${esc(r.icon)} ${esc(t(r.title))}</span><b>${r.cost} ★</b><span class="muted">${k.rewards.some(x => x.id === r.id) ? t("уже добавлено") : ""}</span></div>`).join("")}</div>
      <button class="btn small" data-act="addPackRewards">${t("Добавить готовые награды")}</button></div>
    <div class="card"><h3>${t("Задания")}</h3>
      ${k.tasks.map(x => taskRow(k, x, ui)).join("")}
      <div class="formrow"><input class="full" type="text" id="ntTitle" placeholder="${t("Новое задание")}" maxlength="60" aria-label="${t("Новое задание")}">
        <select id="ntKind" aria-label="${t("Тип задания")}"><option value="move">${t("Движение")}</option><option value="clean">${t("Уборка")}</option></select>
        <select id="ntRepeat" aria-label="${t("Как часто")}"><option value="daily">${t("Каждый день")}</option><option value="once">${t("Разовое")}</option></select>
        <input type="number" id="ntMin" min="1" max="120" placeholder="${t("Минут")}" aria-label="${t("Сколько минут")}">
        <select id="ntHard" aria-label="${t("Сложность")}">${HARDNESS.map(h => `<option value="${h.id}" ${h.id === "normal" ? "selected" : ""}>${t(h.name)}</option>`).join("")}</select>
        <input type="number" id="ntStars" min="1" max="10" value="2" aria-label="${t("Звёзд")}">
        <input type="time" id="ntTime" aria-label="${t("Время напоминания")}"><input type="date" id="ntDue" aria-label="${t("Срок (для разового)")}">
        <div class="full"><div class="muted">${t("Дни недели (если не отмечено, то каждый день)")}</div>${dayChips(ui.ntDays, "ntDay")}</div>
        <div class="hint full" id="ntHint">${t("Звёзды считаются сами по минутам и сложности. Их можно поправить вручную.")}</div>
        <button class="btn small full" data-act="addTask">${t("Добавить задание")}</button></div></div>
    <div class="card"><h3>${t("Награды")}</h3>
      ${k.rewards.map(r => `<div class="pending"><div class="grow">${esc(r.icon || "🎁")} ${esc(t(r.title))}<div class="muted">${rewardNote(k, r.cost)}</div></div><button class="nobtn" data-act="delReward" data-id="${esc(r.id)}" aria-label="${t("Удалить")}">🗑</button></div>`).join("")}
      <div class="formrow"><input class="full" type="text" id="nrTitle" placeholder="${t("Новая награда")}" maxlength="60" aria-label="${t("Новая награда")}">
        <select id="nrTier" class="full" aria-label="${t("Размер впечатления")}">${TIERS.map(x => `<option value="${tierPrice(k, x)}">${t(x.name)} · ${tierPrice(k, x)} ★</option>`).join("")}<option value="">${t("Своя цена")}</option></select>
        <input type="number" id="nrCost" min="1" max="500" value="${tierPrice(k, TIERS[0])}" aria-label="${t("Цена в звёздах")}"><button class="btn small" data-act="addReward">${t("Добавить")}</button></div></div>
    <div class="card"><h3>${t("Плейлисты")}</h3><div class="muted">${t("Вставьте ссылку на плейлист из приложения: «Поделиться» → «Копировать ссылку».")}</div>
      <input type="text" id="plSp" value="${esc(k.playlists.spotify)}" placeholder="https://open.spotify.com/playlist/…" aria-label="${t("Ссылка Spotify")}">
      <input type="text" id="plYm" value="${esc(k.playlists.yandex)}" placeholder="https://music.yandex.ru/users/…/playlists/…" aria-label="${t("Ссылка Яндекс Музыки")}">
      <button class="btn small" data-act="setPlaylists">${t("Сохранить плейлисты")}</button></div>`;
  return `${errBox(ui.err)}${added}${pending}${calCard(M, ui)}${settings}${famRules}${kidList}${family}`;
}

// ---------- settings ----------
export function vSettings(S, ui) {
  const pills = (act, cur, items) => `<div class="pills" style="justify-content:flex-start" role="group">${items.map(([id, name]) => `<button class="pill ${cur === id ? "on" : ""}" data-act="${act}" data-id="${id}">${name}</button>`).join("")}</div>`;
  return `<div class="in"><div class="row"><h2 class="grow">${t("Настройки")}</h2><button class="btn small ghost" data-act="closeSettings">${t("Закрыть")}</button></div>
    <div class="card"><h3>${t("Язык")}</h3>${pills("setLang", getLang(), LANGS)}</div>
    <div class="card"><h3>${t("Тема")}</h3>${pills("setTheme", ui.theme, [["system", t("Как в системе")], ["light", t("Светлая")], ["dark", t("Тёмная")]])}</div>
    ${S.user ? `<div class="card"><h3>${t("Уведомления")}</h3>${pills("setNotify", ui.notify ? "on" : "off", [["on", t("Включены")], ["off", t("Выключены")]])}
      <div class="hint">${t("Уведомления приходят, пока приложение открыто или недавно было открыто. Если оно закрыто, новое будет видно, когда его откроют.")}</div></div>` : ""}
    ${S.role === "parent" && S.family ? dataCard(S, ui) : ""}
    ${S.user ? `<div class="card"><h3>${t("Аккаунт")}</h3><div class="muted">${esc(S.user.email || "")}</div><button class="btn ghost" data-act="signout">${t("Выйти из аккаунта")}</button></div>` : ""}</div>`;
}

function dataCard(S, ui) {
  const two = (S.family.parentUids || []).length > 1, links = legalLinks();
  const confirm = ui.delStage ? `<div class="notice"><b>${ui.delStage === "family" ? t("Удалить семью и все данные?") : t("Выйти из семьи и удалить свой аккаунт?")}</b>
      <div class="muted">${ui.delStage === "family" ? t("Будут удалены все профили детей, их задания, звёзды, правила, копилка и ваш аккаунт. Другой родитель потеряет доступ. Это нельзя отменить.") : t("Вы покинете семью, а ваш аккаунт будет удалён. Семья и данные детей останутся у другого родителя.")}</div>
      <label class="muted" for="delWord">${tf("Для подтверждения введите слово {w}", { w: t("УДАЛИТЬ") })}</label><input type="text" id="delWord" autocomplete="off" autocapitalize="characters">
      <div class="row" style="flex-wrap:wrap"><button class="btn small danger" data-act="${ui.delStage === "family" ? "deleteFamily" : "leaveFamily"}" ${ui.busy ? "disabled" : ""}>${t("Удалить навсегда")}</button><button class="btn small ghost" data-act="delCancel">${t("Отмена")}</button></div></div>` : "";
  return `<div class="card"><h3>${t("Данные и удаление")}</h3>
    ${links ? `<div class="hint">${links}</div>` : ""}
    <div class="muted">${t("Профиль ребёнка можно удалить в кабинете родителя. Здесь можно удалить всю семью или свой аккаунт.")}</div>
    ${ui.err && ui.delStage ? `<div class="err" role="alert">${esc(ui.err)}</div>` : ""}
    ${confirm}
    ${ui.delStage ? "" : `<div class="row" style="flex-wrap:wrap">${two ? `<button class="btn small ghost" data-act="delStart" data-id="leave">${t("Выйти из семьи и удалить аккаунт")}</button>` : ""}<button class="btn small danger" data-act="delStart" data-id="family">${t("Удалить семью и все данные")}</button></div>`}</div>`;
}

// ---------- welcome screens ----------
const HELLO_PARENT = [
  ["Добро пожаловать в Talent Foxes", "Ребёнок выполняет задания и копит звёзды, родитель подтверждает, а звёзды превращаются в награды и в рост питомца."],
  ["Справедливые звёзды", "Калькулятор подскажет, сколько звёзд дать за задание и сколько просить за награду. Достаточно указать, сколько минут занимает дело."],
  ["Без наказаний", "Вместо штрафов есть правила семьи и общая копилка: сначала напоминание, потом небольшой взнос, и звёзды можно вернуть ремонтом."]
];
export const helloSteps = () => HELLO_PARENT.length;
export function vHello(h, k) {
  if (h.role === "kid") return `<div class="in" style="padding-top:24px;align-items:stretch;text-align:center">
      <div class="stage">${drawPet(k, "pet", k.pet.name)}</div><h2>${tf("Привет, {name}!", { name: esc(k.name) })}</h2>
      <div class="muted" style="font-size:16px">${t("Это твой питомец. Выполняй задания и нажимай «Сделано!», а родители их проверят. За звёзды можно получать награды и наряжать питомца.")}</div>
      <button class="btn" data-act="helloDone">${t("Поехали!")}</button></div>`;
  const [title, text] = HELLO_PARENT[h.step], last = h.step === HELLO_PARENT.length - 1;
  return `<div class="in" style="padding-top:48px;align-items:stretch;text-align:center">
      <div class="stage">${drawPet({ pet: { color: "fox", equipped: ["bow"], owned: [] }, log: [], lastActive: today() }, "pet", "Talent Foxes")}</div>
      <h2>${t(title)}</h2><div class="muted" style="font-size:16px">${t(text)}</div>
      <div class="dots">${HELLO_PARENT.map((_, i) => `<i class="${i === h.step ? "on" : ""}"></i>`).join("")}</div>
      <button class="btn" data-act="${last ? "helloDone" : "helloNext"}">${t(last ? "Начать" : "Дальше")}</button>
      ${last ? "" : `<button class="btn ghost" data-act="helloDone">${t("Пропустить")}</button>`}</div>`;
}
