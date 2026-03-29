// Node 25 removed clearImmediate/setImmediate from globals — polyfill for postgres driver
import { setImmediate as si, clearImmediate as ci } from "node:timers";
if (typeof globalThis.clearImmediate === "undefined") {
  (globalThis as any).clearImmediate = ci;
}
if (typeof globalThis.setImmediate === "undefined") {
  (globalThis as any).setImmediate = si;
}
