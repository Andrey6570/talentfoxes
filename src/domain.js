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

export const defaultTasks = () => [
  { id: "m1", title: "Танец под 3 песни", kind: "move", stars: 3, icon: "💃" },
  { id: "m2", title: "20 приседаний", kind: "move", stars: 2, icon: "🏋️" },
  { id: "m3", title: "Прогулка 20 минут", kind: "move", stars: 3, icon: "🚶" },
  { id: "m4", title: "Скакалка 100 прыжков", kind: "move", stars: 3, icon: "🪢" },
  { id: "c1", title: "Заправить кровать", kind: "clean", stars: 1, icon: "🛏️" },
  { id: "c2", title: "Собрать всё с пола", kind: "clean", stars: 2, icon: "🧦" },
  { id: "c3", title: "Разложить 5 вещей по местам", kind: "clean", stars: 2, icon: "📚" },
  { id: "c4", title: "Полная уборка комнаты", kind: "clean", stars: 5, icon: "✨" }
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
export function derive(doc, log, orders) {
  const done = log.filter(l => l.status === "done");
  const total = done.reduce((s, l) => s + (l.stars || 0), 0);
  const spent = orders.filter(o => o.status !== "refused").reduce((s, o) => s + (o.cost || 0), 0);
  const base = newKidDoc("", "", "");
  return Object.assign({}, doc, {
    pet: Object.assign({}, base.pet, doc.pet || {}),
    playlists: Object.assign({}, base.playlists, doc.playlists || {}),
    economy: Object.assign({}, base.economy, doc.economy || {}),
    tasks: doc.tasks || [], rewards: doc.rewards || [],
    log, orders, total, stars: total - spent
  });
}
export const entries = k => k.log.filter(l => l.day === today());
export function statusOf(k, taskId) { const e = entries(k).filter(l => l.taskId === taskId).sort((a, b) => a.ts - b.ts).pop(); return e ? e.status : null; }
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
export const dailyStars = k => k.economy.tasksPerDay * typicalStars(k) * SUCCESS_RATE;
export const roundTidy = n => n < 20 ? Math.max(1, Math.round(n)) : Math.round(n / 5) * 5;
export const tierPrice = (k, tier) => roundTidy(dailyStars(k) * tier.days);
export function taskStars(k, minutes, hardId) {
  const f = (HARDNESS.find(h => h.id === hardId) || HARDNESS[1]).f;
  return Math.max(1, Math.min(10, Math.round(minutes / k.economy.minutesPerStar * f)));
}
export const daysToEarn = (k, cost) => { const d = dailyStars(k); return d > 0 ? cost / d : 0; };
export const priceVerdict = (k, cost) => { const d = daysToEarn(k, cost); return d < 1 ? "cheap" : d > 45 ? "dear" : "ok"; };
