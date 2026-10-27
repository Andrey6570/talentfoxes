// Text of the push notifications. The wording comes from the same dictionaries as the app (i18n.json).
import { readFileSync } from "node:fs";

const dict = JSON.parse(readFileSync(new URL("./i18n.json", import.meta.url), "utf8"));

export function translate(lang, key) {
  if (lang === "en") return dict.en[key] !== undefined ? dict.en[key] : key;
  if (lang === "el") return dict.el[key] !== undefined ? dict.el[key] : dict.en[key] !== undefined ? dict.en[key] : key;
  return key;
}
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, n) => (v[n] !== undefined ? v[n] : ""));

// task, reward and log titles: defaults are translated, custom text stays as typed
const NEUTRAL = { "Не убрал после игры": "Не убрано после игры", "Не сделал вовремя то, о чём договорились": "Договорённость не выполнена вовремя" };
export function disp(lang, s0 = "") {
  const s = NEUTRAL[s0] || s0;
  if (s.indexOf("Зона дня: ") === 0) return fill(translate(lang, "Зона дня: {z}"), { z: translate(lang, s.slice(10)) });
  if (s.indexOf("Ремонт: ") === 0) return fill(translate(lang, "Ремонт: {x}"), { x: translate(lang, s.slice(8)) });
  return translate(lang, s);
}

const SHAPES = {
  logPending: v => ["{kid}: задание выполнено", "{x} · +{n} ★, ждёт проверки", { kid: v.kid, x: v.title, n: v.stars }],
  orderPending: v => ["{kid}: выбрана награда", "{x} · {n} ★", { kid: v.kid, x: v.title, n: v.cost }],
  taskAssigned: v => ["Новое задание", "{x} · +{n} ★", { x: v.title, n: v.stars }],
  tasksAssigned: v => ["Новое задание", "Новых заданий: {n}", { n: v.count }],
  approved: v => ["Родители подтвердили", "{x} · +{n} ★", { x: v.title, n: v.stars }]
};
export function compose(type, lang, v) {
  const [titleKey, bodyKey, vars] = SHAPES[type](v);
  const filled = Object.assign({}, vars, vars.x !== undefined ? { x: disp(lang, vars.x) } : {});
  return { title: fill(translate(lang, titleKey), filled), body: fill(translate(lang, bodyKey), filled) };
}
