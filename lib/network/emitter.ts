import { EventEmitter } from "events";

declare global {
  var sseEmitter: EventEmitter | undefined;
}

export const sseEmitter = globalThis.sseEmitter || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.sseEmitter = sseEmitter;
}
