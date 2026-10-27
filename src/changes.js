// Notices changes in live data while the app is running. The first answer from the server is only a baseline;
// later changes become events. Answers served from the offline cache and the device's own writes never count.
export function createDetector(getRole, emit) {
  let logs, orders, tasks, ready;
  const reset = () => { logs = new Map(); orders = new Map(); tasks = null; ready = new Set(); };
  reset();
  return {
    reset,
    log(kid, list, meta) {
      const key = "log:" + kid.id;
      if (meta.fromCache && !ready.has(key)) return;
      const prev = logs.get(kid.id);
      if (prev && !meta.hasPendingWrites) list.forEach(l => {
        const before = prev.get(l.id);
        if (getRole() === "parent" && before === undefined && l.status === "pending") emit({ type: "logPending", kid: kid.name, title: l.title, stars: l.stars });
        if (getRole() === "kid" && before === "pending" && l.status === "done") emit({ type: "approved", title: l.title, stars: l.stars });
      });
      logs.set(kid.id, new Map(list.map(l => [l.id, l.status]))); ready.add(key);
    },
    orders(kid, list, meta) {
      const key = "orders:" + kid.id;
      if (meta.fromCache && !ready.has(key)) return;
      const prev = orders.get(kid.id);
      if (prev && !meta.hasPendingWrites && getRole() === "parent") list.forEach(o => {
        if (!prev.has(o.id) && o.status === "pending") emit({ type: "orderPending", kid: kid.name, title: o.title, cost: o.cost });
      });
      orders.set(kid.id, new Set(list.map(o => o.id))); ready.add(key);
    },
    tasks(docs, meta) {
      if (getRole() !== "kid" || (meta.fromCache && !tasks)) return;
      const now = new Map(docs.map(d => [d.id, new Set((d.tasks || []).map(x => x.id))]));
      if (tasks && !meta.hasPendingWrites) docs.forEach(d => {
        const before = tasks.get(d.id); if (!before) return;
        (d.tasks || []).filter(x => !before.has(x.id)).forEach(x => emit({ type: "taskAssigned", title: x.title, stars: x.stars }));
      });
      tasks = now;
    }
  };
}
