/** Chaos event parser demo — drop / stall / error injection helpers. */
export function parseChaosEvent(raw) {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

export function injectFailure(events, atIndex, failure) {
  const copy = events.slice();
  copy.splice(atIndex, 0, failure);
  return copy;
}

console.log(
  injectFailure(
    [{ type: "token", text: "a" }, { type: "done" }],
    1,
    { type: "error", message: "chaos", failureClass: "server_error" },
  ),
);
