// Catalogs and pure game rules. Kids passed in here are "derived kids": the Firestore kid document
// plus its log and orders, with stars and total already computed (see store.js).

export const uid = () => Math.random().toString(36).slice(2, 9);
export const dayKey = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
export const today = () => dayKey();

export const COLORS = [
  { id: "fox", main: "#FF8A3D", dark: "#D9621A" }, { id: "violet", main: "#9B7BFF", dark: "#6E4FD6" },
  { id: "teal", main: "#2EC4B6", dark: "#1B9186" }, { id: "pink", main: "#FF6FA5", dark: "#D94A82" }
];
export const ACCENTS = [
  { id: "violet", name: "Фиолетовый", l: "#5B3DF5", d: "#9783FF" }, { id: "mint", name: "Мятный", l: "#0A7F72", d: "#3DD6C2" },
  { id: "pink", name: "Розовый", l: "#C2255C", d: "#FF7FA3" }, { id: "sun", name: "Солнечный", l: "#B85F00", d: "#FFB454" },
  { id: "sky", name: "Голубой", l: "#1C6FBF", d: "#74C0FC" }
];
export const ACCESSORIES = [
  { id: "bow", name: "Бантик", cost: 15, emo: "🎀", slot: "head" }, { id: "glasses", name: "Очки", cost: 20, emo: "🕶️", slot: "face" },
  { id: "party", name: "Колпак", cost: 25, emo: "🥳", slot: "head" }, { id: "phones", name: "Наушники", cost: 30, emo: "🎧", slot: "head" },
  { id: "scarf", name: "Шарф", cost: 40, emo: "🧣", slot: "neck" }, { id: "crown", name: "Корона", cost: 60, emo: "👑", slot: "head" }
];
export const LEVELS = [
  { at: 0, name: "Новичок" }, { at: 15, name: "Чистюля" }, { at: 40, name: "Мастер порядка" },
  { at: 80, name: "Звезда движения" }, { at: 150, name: "Повелитель комнаты" }
];
export const ZONES = ["Письменный стол", "Полка с книгами", "Кровать", "Пол", "Шкаф", "Подоконник", "Игрушки"];
export const CHALLENGES = [
  { icon: "🐸", title: "Прыгай как лягушка 20 раз", kind: "move", stars: 2, color: "#2EC4B6" },
  { icon: "🦀", title: "Дойди как краб до двери и обратно", kind: "move", stars: 2, color: "#FF8A3D" },
  { icon: "🌋", title: "Пол — это лава: убери с пола всё, что мешает пройти", kind: "clean", stars: 3, color: "#9B7BFF" },
  { icon: "🦩", title: "Постой на одной ноге по 30 секунд, потом на другой", kind: "move", stars: 2, color: "#FF6FA5" },
  { icon: "🧺", title: "Найди 5 вещей не на своём месте и верни их", kind: "clean", stars: 2, color: "#2EC4B6" },
  { icon: "🕺", title: "Станцуй любимую песню от начала до конца", kind: "move", stars: 3, color: "#FF8A3D" },
  { icon: "🧊", title: "Замри: танцуй, пока играет музыка, и замирай на паузе, 3 раза", kind: "move", stars: 3, color: "#9B7BFF" },
  { icon: "🔍", title: "Охота за сокровищем: найди потерянную вещь и верни её на место", kind: "clean", stars: 2, color: "#FF6FA5" }
];
export const SAYS = {
  happy: ["Ура! Мы сегодня молодцы!", "Я полон сил. Спасибо!", "В комнате красота, а я танцую!"],
  ok: ["Давай немного подвигаемся?", "Что сегодня будем делать?", "Одно задание, и я улыбнусь!"],
  sad: ["Я скучаю. Потанцуем вместе?", "Давай начнём с маленького задания?", "Мне не хватает наших дел."]
};
const MUSIC_HOSTS = {
  spotify: h => h === "open.spotify.com" || h === "spotify.link",
  yandex: h => /^music\.yandex\.(ru|com|kz|by|uz)$/.test(h)
};

// repeat: "daily" comes back every day after it is done; "once" disappears for good once approved
export const defaultTasks = () => [
  { id: "m1", title: "Танец под 3 песни", kind: "move", stars: 3, icon: "💃", minutes: 12, repeat: "daily" },
  { id: "m2", title: "20 приседаний", kind: "move", stars: 2, icon: "🏋️", minutes: 5, repeat: "daily" },
  { id: "m3", title: "Прогулка 20 минут", kind: "move", stars: 3, icon: "🚶", minutes: 20, repeat: "daily" },
  { id: "m4", title: "Скакалка 100 прыжков", kind: "move", stars: 3, icon: "🪢", minutes: 10, repeat: "daily" },
  { id: "c1", title: "Заправить кровать", kind: "clean", stars: 1, icon: "🛏️", minutes: 2, repeat: "daily" },
  { id: "c2", title: "Собрать всё с пола", kind: "clean", stars: 2, icon: "🧦", minutes: 5, repeat: "daily" },
  { id: "c3", title: "Разложить 5 вещей по местам", kind: "clean", stars: 2, icon: "📚", minutes: 8, repeat: "daily" },
  { id: "c4", title: "Полная уборка комнаты", kind: "clean", stars: 5, icon: "✨", minutes: 40, repeat: "daily" }
];
export const defaultRewards = () => [
  { id: "r1", title: "Выбрать фильм на вечер", cost: 15, icon: "🎬" }, { id: "r2", title: "+30 минут игр", cost: 20, icon: "🎮" },
  { id: "r3", title: "Не мыть посуду один день", cost: 12, icon: "🍽️" }, { id: "r4", title: "Выбрать ужин", cost: 25, icon: "🍕" },
  { id: "r5", title: "Поход в кафе", cost: 60, icon: "🧁" }
];
export const newKidDoc = (name, login, kidUid) => ({
  name, login, kidUid, authVersion: 0, accent: "violet",
  pet: { name: "Рыжик", character: "fox", color: "fox", equipped: [], owned: [] },
  tasks: defaultTasks(), rewards: defaultRewards(), playlists: { spotify: "", yandex: "" }, economy: { tasksPerDay: 4, minutesPerStar: 10 },
  streak: 0, freezes: 1, lastActive: null, createdAt: Date.now()
});

// ---- derived values ----
// Balance = everything approved (bonuses and repairs included) minus purchases and family contributions.
// Level progress ("total") counts only real effort, so a contribution never lowers the level.
export const sum = (list, f = x => x.stars) => list.reduce((s, l) => s + (f(l) || 0), 0);
export function derive(doc, log, orders) {
  const done = log.filter(l => l.status === "done");
  const earned = sum(done.filter(l => l.kind !== "fee" && l.kind !== "warn"));
  const total = sum(done.filter(l => l.kind !== "fee" && l.kind !== "warn" && l.kind !== "repair"));
  const spent = sum(orders.filter(o => o.status !== "refused"), o => o.cost) + sum(done.filter(l => l.kind === "fee"));
  const base = newKidDoc("", "", "");
  return Object.assign({}, doc, {
    pet: Object.assign({}, base.pet, doc.pet || {}),
    playlists: Object.assign({}, base.playlists, doc.playlists || {}),
    economy: Object.assign({}, base.economy, doc.economy || {}),
    tasks: doc.tasks || [], rewards: doc.rewards || [],
    log, orders, total, stars: earned - spent
  });
}
export const entries = k => k.log.filter(l => l.day === today());
// Daily tasks look at today's entries only, so they are active again the next day.
// One-time tasks look at the whole history: once approved they stay done, a pending one stays pending.
export function statusOf(k, taskId, repeat = "daily") {
  const all = repeat === "once" ? k.log.filter(l => l.taskId === taskId) : entries(k).filter(l => l.taskId === taskId);
  if (repeat === "once" && all.some(l => l.status === "done")) return "done";
  const e = all.sort((a, b) => a.ts - b.ts).pop();
  return e ? e.status : null;
}
export const isOnceDone = (k, tk) => tk.repeat === "once" && statusOf(k, tk.id, "once") === "done";
export const doneToday = (k, kind) => entries(k).filter(l => l.status === "done" && l.kind === kind).length;
export function mood(k) {
  if (doneToday(k, "move") + doneToday(k, "clean") >= 2) return "happy";
  return k.lastActive && daysBetween(k.lastActive, today()) <= 1 ? "ok" : "sad";
}
export function level(k) {
  let i = 0; LEVELS.forEach((l, n) => { if (k.total >= l.at) i = n; }); const nx = LEVELS[i + 1];
  return { i, name: LEVELS[i].name, pct: nx ? Math.round((k.total - LEVELS[i].at) / (nx.at - LEVELS[i].at) * 100) : 100, toNext: nx ? nx.at - k.total : 0 };
}
export function aliveStreak(k) {
  if (!k.lastActive) return 0; const g = daysBetween(k.lastActive, today());
  return g <= 1 || (g === 2 && k.freezes > 0) ? k.streak : 0;
}
// Fields to write on the kid document when a task from `day` is approved; null when nothing changes.
export function streakAfter(k, day) {
  let { streak = 0, freezes = 1, lastActive = null } = k;
  if (!lastActive) return { streak: 1, freezes, lastActive: day };
  const gap = daysBetween(lastActive, day); if (gap <= 0) return null;
  if (gap === 1) streak++; else if (gap === 2 && freezes > 0) { freezes--; streak++; } else streak = 1;
  if (streak % 7 === 0) freezes = Math.min(2, freezes + 1);
  return { streak, freezes, lastActive: day };
}
export function zoneTask() {
  const d = new Date(), doy = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
  return { id: "zone-" + today(), title: "Зона дня: " + ZONES[doy % ZONES.length], kind: "clean", stars: 2, icon: "🎯" };
}
export function week(k) {
  const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); const key = dayKey(d);
    const done = k.log.filter(l => l.day === key && l.status === "done" && (l.kind === "move" || l.kind === "clean"));
    out.push({ wd: WD[d.getDay()], move: done.filter(l => l.kind === "move").length, clean: done.filter(l => l.kind === "clean").length });
  }
  return out;
}
// returns "" for empty, null for a link that is not from the expected service
export function checkUrl(v, which) {
  v = (v || "").trim(); if (!v) return "";
  try { const u = new URL(v); if (u.protocol === "https:" && MUSIC_HOSTS[which](u.hostname)) return u.href; } catch (e) {}
  return null;
}

// ---- child sign-in address ----
const RU = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
export const normLogin = s => (s || "").toLowerCase().split("").map(c => RU[c] !== undefined ? RU[c] : c).join("").replace(/[^a-z0-9]/g, "").slice(0, 20);
export const normCode = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
export const kidEmail = (login, code, v, domain) => `${login}${v > 0 ? "v" + v : ""}__${code}@${domain}`;
const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";
export function newInviteCode() { let s = ""; const a = new Uint32Array(8); crypto.getRandomValues(a); a.forEach(n => { s += ALPHA[n % ALPHA.length]; }); return s; }

// ---- economy ----
// 1 star is about `minutesPerStar` minutes of effort. A reward is priced in days of typical earnings, so the
// price scale follows what this child really earns and needs no money amounts.
export const SUCCESS_RATE = 0.7; // share of the expected tasks a child really completes
export const HARDNESS = [
  { id: "easy", name: "Легко", f: 1 }, { id: "normal", name: "Обычно", f: 1.25 },
  { id: "hard", name: "Тяжело", f: 1.5 }, { id: "yuck", name: "Неприятно", f: 1.75 }
];
export const TIERS = [
  { id: "small", name: "Мелкое", days: 2 }, { id: "medium", name: "Среднее", days: 7 }, { id: "large", name: "Крупное", days: 30 }
];
export function typicalStars(k) {
  const a = k.tasks.map(x => x.stars).sort((x, y) => x - y);
  if (!a.length) return 2;
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
}
export const dailyMinutes = k => dailyStars(k) * k.economy.minutesPerStar;
export const dailyStars = k => k.economy.tasksPerDay * typicalStars(k) * SUCCESS_RATE;
export const roundTidy = n => n < 20 ? Math.max(1, Math.round(n)) : Math.round(n / 5) * 5;
export const tierPrice = (k, tier) => roundTidy(dailyStars(k) * tier.days);
export function taskStars(k, minutes, hardId) {
  const f = (HARDNESS.find(h => h.id === hardId) || HARDNESS[1]).f;
  return Math.max(1, Math.min(10, Math.round(minutes / k.economy.minutesPerStar * f)));
}
export const daysToEarn = (k, cost) => { const d = dailyStars(k); return d > 0 ? cost / d : 0; };
export const priceVerdict = (k, cost) => { const d = daysToEarn(k, cost); return d < 1 ? "cheap" : d > 45 ? "dear" : "ok"; };

// ---- family rules: contribution to the family pot ----
// A rule has a fixed price agreed in advance. The first slip of a rule within a week is only a reminder; from the
// second one a small contribution goes to the family pot, never more than the caps below and never below zero.
export const FEE_CAP_ONCE = 3;
export const FEE_CAP_WEEK_SHARE = 0.2;
export const REPAIR_WINDOW_MS = 24 * 3600 * 1000;
export const NOTICE_WINDOW_MS = 3 * 24 * 3600 * 1000;
export const defaultRules = () => [
  { id: "u1", title: "Не убрано после игры", cost: 1, repair: "Собрать игрушки" },
  { id: "u2", title: "Грубое слово", cost: 2, repair: "Извиниться и помочь по дому" },
  { id: "u3", title: "Договорённость не выполнена вовремя", cost: 1, repair: "" }
];
export function planFee(k, rule, now = Date.now()) {
  const weekAgo = now - 7 * 864e5;
  const recent = k.log.filter(l => l.ruleId === rule.id && (l.kind === "warn" || l.kind === "fee") && l.ts >= weekAgo);
  if (!recent.length) return { kind: "warn", amount: 0, why: "first" };
  const week = k.log.filter(l => l.status === "done" && l.ts >= weekAgo);
  const earnedWeek = sum(week.filter(l => l.kind !== "fee" && l.kind !== "warn" && l.kind !== "repair"));
  const feesWeek = sum(week.filter(l => l.kind === "fee"));
  const room = Math.floor(earnedWeek * FEE_CAP_WEEK_SHARE) - feesWeek;
  const amount = Math.max(0, Math.min(rule.cost, FEE_CAP_ONCE, room, k.stars));
  if (amount <= 0) return { kind: "warn", amount: 0, why: k.stars <= 0 ? "empty" : "cap" };
  return { kind: "fee", amount, capped: amount < rule.cost };
}
// recent reminders and contributions the child should see
export const noticesOf = (k, now = Date.now()) =>
  k.log.filter(l => (l.kind === "fee" || l.kind === "warn") && now - l.ts <= NOTICE_WINDOW_MS).sort((a, b) => b.ts - a.ts);
export const repairOpen = (k, fee, now = Date.now()) =>
  !!fee.repair && now - fee.ts <= REPAIR_WINDOW_MS && statusOf(k, "repair-" + fee.id, "once") === null;

// ---- speedrun timer ----
// The clock counts down to endAt. A pause freezes it and pushes endAt back by the pause length. After zero the
// remaining time goes negative (overtime) until the child taps "done".
export function newRun(mins) {
  const now = Date.now();
  return { planned: mins * 60000, startedAt: now, endAt: now + mins * 60000, paused: false, pausedAt: 0, pauses: 0, pausedMs: 0, signalled: false, stage: "run", doneAt: 0, left: 0, over: 0 };
}
export const runRemaining = (r, now = Date.now()) => r.endAt - (r.paused ? r.pausedAt : now);
export const runPausedMs = (r, now = Date.now()) => r.pausedMs + (r.paused && !r.doneAt ? now - r.pausedAt : 0);
export const runActive = (r, now = Date.now()) => Math.max(0, (r.doneAt || now) - r.startedAt - runPausedMs(r, now));
export function pauseRun(r, now = Date.now()) { if (!r.paused) { r.paused = true; r.pausedAt = now; r.pauses++; } return r; }
export function resumeRun(r, now = Date.now()) { if (r.paused) { r.endAt += now - r.pausedAt; r.pausedMs += now - r.pausedAt; r.paused = false; } return r; }
export function finishRun(r, now = Date.now()) {
  resumeRun(r, now);
  r.doneAt = now; r.left = Math.max(0, r.endAt - now); r.over = Math.max(0, now - r.endAt); r.stage = "summary";
  return r;
}
export function fmtMs(ms) {
  const neg = ms < 0, s = neg ? Math.floor(-ms / 1000) : Math.ceil(ms / 1000);
  return (neg ? "-" : "") + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
export const speedPayload = r => ({ planned: r.planned, active: runActive(r), pauses: r.pauses, pausedMs: r.pausedMs, over: r.over, left: r.left });

// ---- ready-made sets by age ----
// Stars are not stored in the set: they are worked out from minutes and difficulty with each child's own economy.
export const AGES = [{"id": "a5", "name": "5–7 лет"}, {"id": "a8", "name": "8–10 лет"}, {"id": "a11", "name": "11–13 лет"}];
const T = (title, kind, minutes, hard, icon, sel) => ({ title, kind, minutes, hard, icon, sel: !!sel });
export const PACKS = {
  a5: [
    T("Зарядка под музыку", "move", 5, "easy", "🎵", 1),
    T("Станцевать одну песню", "move", 4, "easy", "💃", 1),
    T("Попрыгать как зайчик 20 раз", "move", 3, "easy", "🐰", 1),
    T("Игра с мячом", "move", 15, "easy", "⚽", 1),
    T("Прогулка во дворе", "move", 20, "easy", "🌳", 0),
    T("Собрать игрушки в корзину", "clean", 5, "easy", "🧸", 1),
    T("Заправить кровать", "clean", 3, "normal", "🛏️", 1),
    T("Положить одежду в корзину для белья", "clean", 2, "easy", "🧺", 1),
    T("Помочь накрыть на стол", "clean", 5, "easy", "🍽️", 0)
  ],
  a8: [
    T("Зарядка 10 минут", "move", 10, "normal", "🤸", 1),
    T("Танец под 3 песни", "move", 12, "normal", "💃", 1),
    T("Скакалка 100 прыжков", "move", 10, "normal", "🪢", 1),
    T("Прогулка 30 минут", "move", 30, "easy", "🚶", 0),
    T("Велосипед или самокат", "move", 30, "easy", "🚲", 0),
    T("Тренировка или секция", "move", 40, "normal", "🏃", 0),
    T("Заправить кровать", "clean", 2, "easy", "🛏️", 1),
    T("Убрать стол и полку", "clean", 8, "normal", "📚", 1),
    T("Собрать всё с пола", "clean", 5, "normal", "🧦", 1),
    T("Вынести мусор", "clean", 3, "normal", "🗑️", 1),
    T("Разложить чистую одежду по местам", "clean", 8, "normal", "👕", 0),
    T("Полная уборка комнаты", "clean", 40, "hard", "✨", 0)
  ],
  a11: [
    T("Тренировка 30 минут", "move", 30, "normal", "🏋️", 1),
    T("Пробежка или быстрая прогулка", "move", 25, "normal", "🏃", 1),
    T("Растяжка 10 минут", "move", 10, "easy", "🧘", 1),
    T("Велосипед, самокат или ролики", "move", 40, "easy", "🚴", 0),
    T("Спорт с друзьями", "move", 45, "easy", "⚽", 0),
    T("Заправить кровать", "clean", 2, "easy", "🛏️", 1),
    T("Убрать на столе и в рюкзаке", "clean", 8, "normal", "🎒", 1),
    T("Вынести мусор", "clean", 3, "normal", "🗑️", 1),
    T("Помыть посуду после ужина", "clean", 15, "normal", "🍽️", 1),
    T("Пропылесосить свою комнату", "clean", 15, "normal", "🧹", 0),
    T("Постирать и разложить свои вещи", "clean", 20, "hard", "👕", 0),
    T("Приготовить простое блюдо", "clean", 30, "normal", "🍳", 0)
  ]
};
export function packTasks(ageId, economy) {
  const k = { economy };
  return (PACKS[ageId] || []).map((p, i) => ({ id: "tpl-" + ageId + "-" + i, title: p.title, kind: p.kind, stars: taskStars(k, p.minutes, p.hard), icon: p.icon, minutes: p.minutes, repeat: "daily", sel: p.sel }));
}
const RW = (title, tier, f, icon) => ({ title, tier, f, icon });
export const REWARD_PACK = [
  RW("Выбрать фильм на вечер", "small", 1.0, "🎬"),
  RW("Десерт на выбор", "small", 0.7, "🍨"),
  RW("Дополнительные 20 минут игр или мультиков", "small", 1.2, "🎮"),
  RW("Поход в кафе или за мороженым", "medium", 1.0, "🧁"),
  RW("Вечер настольных игр с родителями", "medium", 0.8, "🎲"),
  RW("Пригласить друга в гости", "medium", 1.3, "🧑‍🤝‍🧑"),
  RW("Поход в кино", "large", 1.0, "🍿"),
  RW("Аквапарк, батут или каток", "large", 1.2, "🎢"),
  RW("Книга или игрушка на выбор", "large", 0.8, "🎁")
];
// priced from the child's own earnings: a small treat is about 2 days of work, a medium one a week, a large one a month
export function packRewards(k) {
  return REWARD_PACK.map((r, i) => ({ id: "tplr-" + i, title: r.title, icon: r.icon, tier: r.tier, cost: Math.max(1, roundTidy(tierPrice(k, TIERS.find(x => x.id === r.tier)) * r.f)) }));
}
// starting tasks and rewards for a new child of this age
export function starterKit(ageId, economy) {
  if (!PACKS[ageId]) return null;
  const tasks = packTasks(ageId, economy).filter(x => x.sel).map(({ sel, ...x }) => x);
  return { tasks, rewards: packRewards({ tasks, economy }).map(({ tier, ...x }) => x) };
}

// ---- dates, schedules and family events ----
// Dates are plain "YYYY-MM-DD" strings in the device's local time. Weekdays are 1 (Monday) to 7 (Sunday).
export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const BYDAY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
export const pad = n => String(n).padStart(2, "0");
export const parseDay = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const fmtDay = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
export const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return fmtDay(d); };
export const isoWeekday = s => { const w = parseDay(s).getDay(); return w === 0 ? 7 : w; };
export const atTime = (s, hhmm) => { const d = parseDay(s), [h, m] = hhmm.split(":").map(Number); d.setHours(h, m, 0, 0); return d; };
const fmtLocal = d => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";

// A regular task with weekdays shows only on those days; one-time tasks show until they are done.
export const taskOn = (tk, day) => tk.repeat === "once" || !(tk.days && tk.days.length) || tk.days.includes(isoWeekday(day));
export const hasSchedule = tk => !!(tk.time || tk.due || (tk.days && tk.days.length && tk.days.length < 7));

// events: { title, date, time, end, repeat: none|weekly|yearly, who: "all" | [kidId] }
export function eventOn(ev, day) {
  if (day < ev.date) return false;
  if (ev.repeat === "weekly") return isoWeekday(day) === isoWeekday(ev.date);
  if (ev.repeat === "yearly") return day.slice(5) === ev.date.slice(5);
  return day === ev.date;
}
export const eventFor = (ev, kidId) => !ev.who || ev.who === "all" || (Array.isArray(ev.who) && ev.who.includes(kidId));

// Everything planned for a day: family events and scheduled tasks, ordered by time (untimed first).
export function dayItems(day, events, kids, forKid = null) {
  const out = [];
  events.filter(ev => eventOn(ev, day) && (!forKid || eventFor(ev, forKid.id))).forEach(ev => {
    const names = forKid || ev.who === "all" || !Array.isArray(ev.who) ? "" : kids.filter(k => ev.who.includes(k.id)).map(k => k.name).join(", ");
    out.push({ type: "event", id: ev.id, time: ev.time || "", end: ev.end || "", title: ev.title, who: names, ev });
  });
  kids.filter(k => !forKid || k.id === forKid.id).forEach(k => k.tasks.filter(tk => hasSchedule(tk) && taskOn(tk, day) && (tk.repeat !== "once" || !tk.due || tk.due === day) && !isOnceDone(k, tk)).forEach(tk => {
    out.push({ type: "task", id: tk.id, time: tk.time || "", title: tk.title, who: forKid ? "" : k.name, task: tk, kid: k });
  }));
  return out.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}

// Reminders for the next days. They are scheduled on the device itself, so they work with the app closed.
export const REMIND_BEFORE_MIN = 10, REMIND_DAYS = 7, REMIND_MAX = 60, ALLDAY_REMIND_AT = "09:00";
export function reminderPlan({ role, kid, kids, events, now = new Date() }) {
  const today0 = fmtDay(now), out = [];
  for (let i = 0; i < REMIND_DAYS; i++) {
    const day = addDays(today0, i);
    const items = role === "kid" ? dayItems(day, events, [kid], kid) : dayItems(day, events, kids).filter(x => x.type === "event");
    items.forEach(x => {
      if (x.type === "task") {
        if (!x.time || (i === 0 && statusOf(kid, x.id, x.task.repeat) === "done")) return;
        out.push({ at: atTime(day, x.time).getTime(), title: "Пора: {x}", x: x.title });
      } else if (x.time) out.push({ at: atTime(day, x.time).getTime() - REMIND_BEFORE_MIN * 60000, title: "Скоро: {x}", x: x.title, body: x.time });
      else out.push({ at: atTime(day, ALLDAY_REMIND_AT).getTime(), title: "Сегодня: {x}", x: x.title });
    });
  }
  return out.filter(r => r.at > now.getTime() + 30000).sort((a, b) => a.at - b.at).slice(0, REMIND_MAX);
}

// A prefilled Google Calendar event (no sign-in or API: the person just taps Save)
export function gcalUrl({ title, details = "", day, time = "", end = "", repeat = "none", days = null }, tz = "") {
  const q = ["action=TEMPLATE", "text=" + encodeURIComponent(title)];
  if (time) {
    const s = atTime(day, time), e = end ? atTime(day, end) : new Date(s.getTime() + 30 * 60000);
    q.push("dates=" + fmtLocal(s) + "/" + fmtLocal(e)); if (tz) q.push("ctz=" + encodeURIComponent(tz));
  } else q.push("dates=" + day.replace(/-/g, "") + "/" + addDays(day, 1).replace(/-/g, ""));
  if (details) q.push("details=" + encodeURIComponent(details));
  const rule = repeat === "weekly" ? "FREQ=WEEKLY" : repeat === "yearly" ? "FREQ=YEARLY" : repeat === "daily" ? "FREQ=DAILY"
    : repeat === "byday" && days && days.length ? "FREQ=WEEKLY;BYDAY=" + days.map(d => BYDAY[d - 1]).join(",") : "";
  if (rule) q.push("recur=" + encodeURIComponent("RRULE:" + rule));
  return "https://calendar.google.com/calendar/render?" + q.join("&");
}
export function taskGcal(tk, from = fmtDay(new Date()), tz = "") {
  if (tk.repeat === "once") return gcalUrl({ title: tk.title, day: tk.due || from, time: tk.time || "" }, tz);
  let day = from; for (let i = 0; i < 7 && !taskOn(tk, day); i++) day = addDays(day, 1);
  const days = tk.days && tk.days.length && tk.days.length < 7 ? tk.days : null;
  return gcalUrl({ title: tk.title, day, time: tk.time || "", repeat: days ? "byday" : "daily", days }, tz);
}
