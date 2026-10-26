import { t, tf, pl, disp, getLang } from "./i18n.js";
import { drawPet } from "./characters.js";
import { CHARACTERS, characterOf } from "./characters.js";
import { COLORS, ACCENTS, ACCESSORIES, CHALLENGES, SAYS, level, mood, aliveStreak, doneToday, statusOf, zoneTask, week, today, HARDNESS, TIERS, typicalStars, dailyStars, tierPrice, daysToEarn, priceVerdict } from "./domain.js";

import { esc } from "./util.js";
export { esc };
export const STAR = '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.9z"/></svg>';
export const STAR_S = STAR.replace('class="st"', 'class="st" width="16" height="16" style="vertical-align:-2px"');
const PLAIN = { id: "x", pet: { color: "fox", equipped: [], owned: [], name: "" }, log: [], lastActive: null };

export const TABS = [
  { id: "home", name: "Питомец", svg: '<circle cx="7" cy="9" r="2.2"/><circle cx="17" cy="9" r="2.2"/><circle cx="4" cy="14" r="2"/><circle cx="20" cy="14" r="2"/><path d="M12 12c-3 0-5 3-5 5.5 0 1.6 1.4 2.5 3 2 1-.3 1.3-.5 2-.5s1 .2 2 .5c1.6.5 3-.4 3-2C17 15 15 12 12 12z"/>' },
  { id: "tasks", name: "Задания", svg: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12.5l3 3 5-6"/>' },
  { id: "wheel", name: "Колесо", svg: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7"/>' },
  { id: "shop", name: "Магазин", svg: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>' }
];

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
      <h3>${t("Создать семью")}</h3><input id="famName" type="text" maxlength="30" placeholder="${t("Название семьи")}" aria-label="${t("Название семьи")}">
      <button class="btn" data-act="createFamily" ${ui.busy ? "disabled" : ""}>${t("Создать")}</button></div>
    <div class="card" style="align-items:stretch"><h3>${t("Присоединиться к семье")}</h3><div class="muted">${t("Второй родитель вводит код семьи, который показан в кабинете первого.")}</div>
      <input id="joinCode" type="text" autocapitalize="none" maxlength="12" placeholder="abcd2345" aria-label="${t("Код семьи")}">
      <button class="btn ghost" data-act="joinFamily" ${ui.busy ? "disabled" : ""}>${t("Присоединиться")}</button></div>`;
}

// ---------- child ----------
function taskCard(k, tk) {
  const st = statusOf(k, tk.id);
  const right = st === "done" ? `<div class="state ok">${t("Засчитано")}</div>` : st === "pending" ? `<div class="state wait">${t("Ждёт проверки")}</div>`
    : `<button class="btn small" data-act="submit" data-id="${esc(tk.id)}">${st === "rejected" ? t("Ещё раз") : t("Сделано!")}</button>`;
  return `<div class="task ${tk.kind}"><div class="ic">${esc(tk.icon || "⭐")}</div><div class="grow"><div class="t">${esc(disp(tk.title))}</div><span class="reward-line">${STAR}+${tk.stars}</span></div>${right}</div>`;
}

export function musicLinks(k) {
  const sp = k.playlists.spotify, ym = k.playlists.yandex, out = [];
  if (sp) out.push(`<a class="btn small sp" href="${esc(sp)}" target="_blank" rel="noopener noreferrer">Spotify</a>`);
  if (ym) out.push(`<a class="btn small ym" href="${esc(ym)}" target="_blank" rel="noopener noreferrer">Яндекс Музыка</a>`);
  return out.join("");
}

export function vHome(k) {
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
    <div class="card"><h3>${t("Музыка для дел")}</h3>${links ? `<div class="muted">${t("Включить плейлист:")}</div><div class="music">${links}</div>` : `<div class="muted">${t("Родители ещё не добавили плейлист.")}</div>`}</div>`;
}

function timerHtml(k, ui) {
  const st = statusOf(k, "speed-" + today()), r = ui.run, links = musicLinks(k);
  if (st === "done") return `<h3>${t("Спидран на сегодня засчитан")}</h3><div class="muted">${t("Завтра можно попробовать снова.")}</div>`;
  if (st === "pending") return `<h3>${t("Спидран ждёт проверки")}</h3><div class="muted">${t("Родители скоро посмотрят.")}</div>`;
  if (r && r.finished) return `<div class="bubble">${t("Время! Успела?")}</div><h3>${t("Как получилось?")}</h3><div class="row" style="flex-wrap:wrap;justify-content:center"><button class="btn" data-act="speedDone">${t("Убрала! +3")}</button><button class="btn ghost" data-act="speedStop">${t("Ещё не всё")}</button></div>`;
  if (r) return `<div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="var(--surface2)" stroke-width="9"/><circle id="ringArc" cx="50" cy="50" r="44" fill="none" stroke="var(--clean)" stroke-width="9" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><div class="time" id="ringTime">--:--</div></div>${links ? `<div class="music">${links}</div>` : ""}<button class="btn ghost" data-act="speedStop">${t("Остановить")}</button>`;
  return `<h3>${t("Уборка на время")}</h3><div class="muted">${t("Включи свой любимый плейлист и успей убрать комнату до конца таймера.")}</div>
    ${links ? `<div class="music" style="justify-content:center">${links}</div>` : ""}
    <div class="pills">${[5, 10, 15].map(n => `<button class="pill ${ui.mins === n ? "on" : ""}" data-act="mins" data-id="${n}">${tf("{n} мин", { n })}</button>`).join("")}</div>
    <button class="btn" data-act="speedStart">${t("Старт")}</button>`;
}

export function vTasks(k, ui) {
  const mv = k.tasks.filter(x => x.kind === "move"), cl = [zoneTask()].concat(k.tasks.filter(x => x.kind === "clean"));
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
    statusOf(k, pk.id) === "pending" ? `<div class="state wait">${t("Ждёт проверки")}</div>` : statusOf(k, pk.id) === "done" ? `<div class="state ok">${t("Засчитано")}</div>` : `<button class="btn" data-act="submitPick">${t("Сделала!")}</button>`}</div>`
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

// ---------- parent cabinet ----------
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
  const tag = x => kids.length > 1 ? `<span class="kidtag">${esc(x.name)}</span> ` : "";
  const pending = `<div class="card"><h3>${t("Нужно подтвердить")}</h3>${pendLogs.length || pendOrders.length ? "" : `<div class="muted">${t("Пока ничего нет")}</div>`}
    ${pendLogs.map(({ k: x, l }) => `<div class="pending"><div class="grow"><div>${tag(x)}${esc(disp(l.title))}</div><div class="muted">${tf("{k} · +{n} {w}", { k: t(l.kind === "move" ? "Движение" : "Уборка"), n: l.stars, w: pl(l.stars, "звезда|звезды|звёзд", "star|stars") })}</div></div><button class="nobtn" data-act="logNo" data-kid="${x.id}" data-id="${l.id}" aria-label="${t("Не засчитать")}">✕</button><button class="okbtn" data-act="logOk" data-kid="${x.id}" data-id="${l.id}" aria-label="${t("Засчитать")}">✓</button></div>`).join("")}
    ${pendOrders.map(({ k: x, o }) => `<div class="pending"><div class="grow"><div>${tag(x)}${esc(o.icon || "🎁")} ${esc(t(o.title))}</div><div class="muted">${tf("Награда за {n} {w}", { n: o.cost, w: pl(o.cost, "звезду|звезды|звёзд", "star|stars") })}</div></div><button class="nobtn" data-act="orderNo" data-kid="${x.id}" data-id="${o.id}" aria-label="${t("Вернуть звёзды")}">↩</button><button class="okbtn" data-act="orderOk" data-kid="${x.id}" data-id="${o.id}" aria-label="${t("Выдано")}">✓</button></div>`).join("")}</div>`;

  const family = `<div class="card"><h3>${t("Семья")}</h3>
      <div class="pwrow"><input type="text" id="famNameEdit" maxlength="30" value="${esc(fam.name)}" aria-label="${t("Название семьи")}"><button class="btn small" data-act="renameFamily">${t("Сохранить")}</button></div>
      <div class="muted">${t("Код семьи")}</div><div class="code" id="famCode">${esc(fam.inviteCode)}</div>
      <div class="hint">${t("Этот код нужен ребёнку для входа и второму родителю для присоединения.")}</div>
      <div class="hint">${tf("Родителей в семье: {n} из 2", { n: (fam.parentUids || []).length })}</div></div>`;

  const kidList = `<div class="card"><h3>${t("Дети")}</h3>
      ${kids.length ? "" : `<div class="muted">${t("Добавьте первого ребёнка")}</div>`}
      ${kids.map(x => `<div style="display:flex;flex-direction:column;gap:8px;padding-top:10px;border-top:1px solid var(--line)">
        <div class="pwrow"><input type="text" maxlength="20" value="${esc(x.name)}" data-kidname="${x.id}" aria-label="${t("Имя ребёнка")}">${ui.delKid === x.id ? `<button class="btn small danger" data-act="delKid" data-id="${x.id}">${t("Точно удалить?")}</button>` : `<button class="nobtn" data-act="delKid" data-id="${x.id}" aria-label="${t("Удалить")}">🗑</button>`}</div>
        <div class="muted">${t("Логин")}: <b>${esc(x.login)}</b></div>
        <div class="pwrow"><input type="text" id="rp-${x.id}" autocomplete="off" maxlength="40" placeholder="${t("Новый пароль, от 6 символов")}" aria-label="${t("Новый пароль ребёнка")}"><button class="btn small" data-act="resetPw" data-id="${x.id}">${t("Сменить")}</button></div></div>`).join("")}
      <h3 style="margin-top:6px">${t("Добавить ребёнка")}</h3>
      <div class="formrow"><input class="full" type="text" id="nkName" maxlength="20" placeholder="${t("Имя")}" aria-label="${t("Имя")}">
        <input type="text" id="nkLogin" autocapitalize="none" maxlength="20" placeholder="${t("Логин латиницей")}" aria-label="${t("Логин")}">
        <input type="text" id="nkPw" autocomplete="off" maxlength="40" placeholder="${t("Пароль, от 6 символов")}" aria-label="${t("Пароль")}">
        <button class="btn small full" data-act="addKid" ${ui.busy ? "disabled" : ""}>${t("Добавить ребёнка")}</button></div></div>`;

  if (!kids.length) return `${errBox(ui.err)}${pending}${kidList}${family}`;

  if (!kids.find(x => x.id === ui.pk)) ui.pk = kids[0].id;
  const k = kids.find(x => x.id === ui.pk), wk = week(k), max = Math.max(1, ...wk.map(d => d.move + d.clean));
  const settings = `${kids.length > 1 ? `<div class="muted">${t("Для кого настраиваем:")}</div>` : ""}
    <div class="pk" role="group">${kids.map(x => `<button class="pill ${x.id === k.id ? "on" : ""}" data-act="pk" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>
    <div class="card"><h3>${t("Бонус за старание")}</h3><div class="muted">${t("Например, если убралась без напоминания.")}</div>
      <div class="row" style="flex-wrap:wrap">${[1, 3, 5].map(n => `<button class="btn small" data-act="bonus" data-id="${n}">+${n}</button>`).join("")}</div></div>
    <div class="card"><h3>${t("Последние 7 дней")}</h3>
      <div class="chart">${wk.map(d => { const tot = d.move + d.clean; return `<div class="col"><span>${tot || ""}</span><div class="stack" style="height:${Math.round(tot / max * 90)}px"><i style="height:${tot ? d.move / tot * 100 : 0}%;background:var(--move)"></i><i style="height:${tot ? d.clean / tot * 100 : 0}%;background:var(--clean)"></i></div><span class="muted">${t(d.wd)}</span></div>`; }).join("")}</div>
      <div class="legend"><span><b style="background:var(--move)"></b>${t("Движение")}</span><span><b style="background:var(--clean)"></b>${t("Уборка")}</span></div>
      <div class="muted">${tf("Подтверждённых заданий в день. Всего звёзд заработано: {n}.", { n: k.total })} ${tf("Сейчас на счёте: {n}.", { n: k.stars })}</div></div>
    <div class="card"><h3>${t("Экономика звёзд")}</h3>
      <div class="muted">${t("Сколько заданий в день вы ждёте от ребёнка?")}</div>
      <div class="pills" style="justify-content:flex-start">${[2, 3, 4].map(n => `<button class="pill ${k.economy.tasksPerDay === n ? "on" : ""}" data-act="econTasks" data-id="${n}">${n}</button>`).join("")}</div>
      <div class="muted">${t("1 звезда — это примерно столько минут усилий:")}</div>
      <div class="pills" style="justify-content:flex-start">${[5, 10, 15].map(n => `<button class="pill ${k.economy.minutesPerStar === n ? "on" : ""}" data-act="econMinutes" data-id="${n}">${tf("{n} мин", { n })}</button>`).join("")}</div>
      <div class="econ"><b>${tf("≈ {d} ★ в день, ≈ {w} ★ в неделю", { d: Math.round(dailyStars(k) * 10) / 10, w: Math.round(dailyStars(k) * 7) })}</b></div>
      <div class="muted">${t("Ориентир цен на награды:")}</div>
      <div class="ladder">${TIERS.map(x => `<div class="rung"><span>${t(x.name)}</span><b>${tierPrice(k, x)} ★</b><span class="muted">${tf("≈ {n} дн.", { n: x.days })}</span></div>`).join("")}</div>
      <div class="hint">${tf("Расчёт: {n} задания в день × типичные {s} ★ × 70% (ребёнок делает не всё).", { n: k.economy.tasksPerDay, s: Math.round(typicalStars(k) * 10) / 10 })}</div></div>
    <div class="card"><h3>${t("Задания")}</h3>
      ${k.tasks.map(x => `<div class="pending"><div class="grow">${esc(x.icon || "")} ${esc(disp(x.title))}<div class="muted">${tf(x.kind === "move" ? "Движение · {n}★" : "Уборка · {n}★", { n: x.stars })}</div></div><button class="nobtn" data-act="delTask" data-id="${esc(x.id)}" aria-label="${t("Удалить")}">🗑</button></div>`).join("")}
      <div class="formrow"><input class="full" type="text" id="ntTitle" placeholder="${t("Новое задание")}" maxlength="60" aria-label="${t("Новое задание")}">
        <select id="ntKind" aria-label="${t("Тип задания")}"><option value="move">${t("Движение")}</option><option value="clean">${t("Уборка")}</option></select>
        <select id="ntHard" aria-label="${t("Сложность")}">${HARDNESS.map(h => `<option value="${h.id}" ${h.id === "normal" ? "selected" : ""}>${t(h.name)}</option>`).join("")}</select>
        <input type="number" id="ntMin" min="1" max="120" placeholder="${t("Минут")}" aria-label="${t("Сколько минут")}">
        <input type="number" id="ntStars" min="1" max="10" value="2" aria-label="${t("Звёзд")}">
        <button class="btn small ghost full" data-act="suggestStars">${t("Подсказать звёзды по минутам и сложности")}</button>
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
  return `${errBox(ui.err)}${pending}${settings}${kidList}${family}`;
}
