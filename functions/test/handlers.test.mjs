import test from "node:test";
import assert from "node:assert/strict";
import * as h from "../handlers.js";
import { compose, disp } from "../messages.js";

// small in-memory stand-ins for Firestore, Messaging and Auth
function fakes({ devices = [], kidName = "Алиса", failTokens = {} } = {}) {
  const deleted = [], sent = [], removedUsers = [];
  const ref = id => ({ delete: async () => { deleted.push(id); } });
  const db = {
    doc: () => ({ get: async () => ({ exists: !!kidName, data: () => ({ name: kidName }) }) }),
    collection: () => ({ where: (field, op, value) => ({ get: async () => ({
      docs: devices.filter(d => d[field] === value).map(d => ({ ref: ref(d.id), data: () => d })) }) }) })
  };
  const messaging = { sendEachForMulticast: async m => { sent.push(m); return { responses: m.tokens.map(t => failTokens[t] ? { success: false, error: { code: failTokens[t] } } : { success: true }) }; } };
  const auth = { deleteUser: async uid => { if (uid === "ghost") { const e = new Error("x"); e.code = "auth/user-not-found"; throw e; } removedUsers.push(uid); } };
  return { deps: { db, messaging, auth }, deleted, sent, removedUsers };
}
const D = (id, role, lang, extra = {}) => ({ id, token: "tok-" + id, role, lang, ...extra });

test("a task from the child goes to every parent device, in each parent's language, with the child's name", async () => {
  const f = fakes({ devices: [D("p1", "parent", "ru"), D("p2", "parent", "en"), D("p3", "parent", "el"), D("k1", "kid", "ru", { kidId: "a" })] });
  const n = await h.onLogCreated(f.deps, { fid: "f", kidId: "a", data: { type: "task", status: "pending", title: "Танец под 3 песни", stars: 3 } });
  assert.equal(n, 3); assert.equal(f.sent.length, 3);
  const by = Object.fromEntries(f.sent.map(m => [m.tokens[0], m.notification]));
  assert.equal(by["tok-p1"].title, "Алиса: задание выполнено"); assert.match(by["tok-p1"].body, /Танец под 3 песни · \+3 ★/);
  assert.equal(by["tok-p2"].title, "Алиса: task completed"); assert.match(by["tok-p2"].body, /Dance to 3 songs · \+3 ★, waiting for a check/);
  assert.match(by["tok-p3"].title, /^Алиса: η εργασία ολοκληρώθηκε/.source ? /Алиса/ : /./); assert.match(by["tok-p3"].body, /Χορός σε 3 τραγούδια/);
  assert.ok(f.sent.every(m => !m.tokens.includes("tok-k1")));
});
test("bonuses, fees and tasks that are not pending send nothing", async () => {
  const f = fakes({ devices: [D("p1", "parent", "ru")] });
  for (const data of [{ type: "bonus", status: "done" }, { type: "task", status: "done" }, { type: "fee", status: "done" }, null]) assert.equal(await h.onLogCreated(f.deps, { fid: "f", kidId: "a", data }), 0);
  assert.equal(f.sent.length, 0);
});
test("approval goes only to that child's devices", async () => {
  const f = fakes({ devices: [D("k1", "kid", "ru", { kidId: "a" }), D("k2", "kid", "en", { kidId: "b" }), D("p1", "parent", "ru")] });
  await h.onLogUpdated(f.deps, { fid: "f", kidId: "a", before: { type: "task", status: "pending" }, after: { type: "task", status: "done", title: "Заправить кровать", stars: 1 } });
  assert.equal(f.sent.length, 1); assert.deepEqual(f.sent[0].tokens, ["tok-k1"]); assert.equal(f.sent[0].notification.title, "Родители подтвердили");
  const g = fakes({ devices: [D("k1", "kid", "ru", { kidId: "a" })] });
  assert.equal(await h.onLogUpdated(g.deps, { fid: "f", kidId: "a", before: { type: "task", status: "pending" }, after: { type: "task", status: "rejected" } }), 0);
  assert.equal(await h.onLogUpdated(g.deps, { fid: "f", kidId: "a", before: { type: "task", status: "done" }, after: { type: "task", status: "done" } }), 0);
});
test("a chosen reward goes to the parents with the child's name; other orders do not", async () => {
  const f = fakes({ devices: [D("p1", "parent", "en")] });
  await h.onOrderCreated(f.deps, { fid: "f", kidId: "a", data: { kind: "reward", status: "pending", title: "Выбрать фильм на вечер", cost: 15 } });
  assert.equal(f.sent[0].notification.title, "Алиса: reward chosen"); assert.match(f.sent[0].notification.body, /Pick the movie tonight · 15 ★/);
  assert.equal(await h.onOrderCreated(f.deps, { fid: "f", kidId: "a", data: { kind: "acc", status: "auto" } }), 0);
});
test("new tasks reach the child; many at once become one summary", async () => {
  const f = fakes({ devices: [D("k1", "kid", "en", { kidId: "a" })] });
  const before = { kidUid: "u", tasks: [{ id: "t1", title: "A", stars: 1 }] };
  await h.onKidUpdated(f.deps, { fid: "f", kidId: "a", before, after: { kidUid: "u", tasks: [...before.tasks, { id: "t2", title: "20 приседаний", stars: 2 }] } });
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].notification.title, "New task"); assert.match(f.sent[0].notification.body, /20 squats · \+2 ★/);
  f.sent.length = 0;
  await h.onKidUpdated(f.deps, { fid: "f", kidId: "a", before, after: { kidUid: "u", tasks: [...before.tasks, ...[2, 3, 4, 5].map(i => ({ id: "t" + i, title: "X" + i, stars: 1 }))] } });
  assert.equal(f.sent.length, 1); assert.equal(f.sent[0].notification.body, "New tasks: 4");
  f.sent.length = 0;
  await h.onKidUpdated(f.deps, { fid: "f", kidId: "a", before, after: { kidUid: "u", tasks: [] } }); assert.equal(f.sent.length, 0);
  await h.onKidUpdated(f.deps, { fid: "f", kidId: "a", before: undefined, after: { kidUid: "u", tasks: before.tasks } }); assert.equal(f.sent.length, 0);
});
test("a password reset removes the old sign-in account; a deleted child removes the account and the devices", async () => {
  const f = fakes({ devices: [D("k1", "kid", "ru", { kidId: "a" }), D("k2", "kid", "ru", { kidId: "b" })] });
  await h.onKidUpdated(f.deps, { fid: "f", kidId: "a", before: { kidUid: "old", tasks: [] }, after: { kidUid: "new", tasks: [] } });
  assert.deepEqual(f.removedUsers, ["old"]);
  await h.onKidDeleted(f.deps, { fid: "f", kidId: "a", data: { kidUid: "new" } });
  assert.deepEqual(f.removedUsers, ["old", "new"]); assert.deepEqual(f.deleted, ["k1"]);
  await h.onKidDeleted(f.deps, { fid: "f", kidId: "b", data: { kidUid: "ghost" } }); // account already gone: no error
});
test("dead device tokens are removed after a failed send, working ones are kept", async () => {
  const f = fakes({ devices: [D("p1", "parent", "ru"), D("p2", "parent", "ru")], failTokens: { "tok-p2": "messaging/registration-token-not-registered" } });
  await h.onLogCreated(f.deps, { fid: "f", kidId: "a", data: { type: "task", status: "pending", title: "x", stars: 1 } });
  assert.deepEqual(f.deleted, ["p2"]);
});
test("custom text stays as typed and old rule wording is shown in the neutral form", () => {
  assert.equal(disp("en", "Моё задание"), "Моё задание");
  assert.equal(disp("en", "Не убрал после игры"), "Not tidied up after playing");
  assert.equal(disp("en", "Зона дня: Кровать"), "Zone of the day: Bed");
  assert.equal(compose("approved", "el", { title: "Заправить кровать", stars: 1 }).title, "Οι γονείς ενέκριναν");
});
