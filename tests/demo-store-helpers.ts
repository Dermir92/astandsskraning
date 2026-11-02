import { DemoStore as RealDemoStore } from "../src/components/demo-provider";
import type { DemoEnvironment } from "../src/lib/demo-storage";
import type { Report } from "../src/lib/model";

export function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
export class MemoryStorage {
  values = new Map<string, string>();
  writes: { key: string; value: string }[] = [];
  failRead = false;
  failWrite = false;
  failRemove = false;
  getItem(key: string) { if (this.failRead) throw new Error("Synthetic read failure"); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.writes.push({ key, value }); if (this.failWrite) throw new Error("Synthetic quota"); this.values.set(key, value); }
  removeItem(key: string) { if (this.failRemove) throw new Error("Synthetic remove failure"); this.values.delete(key); }
}
export class ControlledLocks {
  paused = false;
  fail = false;
  owner: object | null = null;
  maxOwners = 0;
  pending: (() => void)[] = [];
  private revoke?: (error: unknown) => void;
  request = ((name: string, options: LockOptions, callback: (lock: Lock | null) => unknown) => {
    if (options.mode !== "exclusive" || options.ifAvailable !== true || options.steal) throw Error("Unsafe lock options");
    const result = deferred<unknown>();
    const run = () => {
      if (this.fail) { result.reject(Error("Synthetic lock denial")); return; }
      if (this.owner) { result.resolve(callback(null)); return; }
      const identity = {}; this.owner = identity; this.maxOwners = Math.max(this.maxOwners, 1);
      this.revoke = error => { if (this.owner === identity) this.owner = null; result.reject(error); };
      let held: unknown;
      try { held = callback({ name, mode: "exclusive" } as Lock); }
      catch (error) { this.owner = null; result.reject(error); return; }
      Promise.resolve(held).then(value => {
        if (this.owner === identity) this.owner = null;
        result.resolve(value);
      }, error => { if (this.owner === identity) this.owner = null; result.reject(error); });
    };
    if (this.paused) this.pending.push(run); else run();
    return result.promise;
  }) as LockManager["request"];
  grant(index = 0) { const run = this.pending.splice(index, 1)[0]; if (!run) throw Error("No pending request"); run(); }
  lose() { this.revoke?.(Error("Synthetic unexpected lock loss")); }
}
export function demoTab(local = new MemoryStorage(), locks = new ControlledLocks(), session = new MemoryStorage()) {
  const events = new EventTarget();
  let listeners = 0;
  const env: DemoEnvironment = {
    local: () => local, session: () => session, secure: () => true, locks: () => locks,
    listen(type, listener) { events.addEventListener(type, listener); listeners++; return () => { events.removeEventListener(type, listener); listeners--; }; },
  };
  return { env, local, locks, session, events,
    listenerCount: () => listeners,
    storageEvent(key: string | null) { const event = new Event("storage"); Object.assign(event, { key }); events.dispatchEvent(event); },
    transition(type: "pagehide" | "pageshow") { const event = new Event(type); Object.assign(event, { persisted: true }); events.dispatchEvent(event); },
  };
}

// Existing domain/compatibility tests model isolated, sequential editing sessions.
// Only their synthetic storage is global; each gets its own synchronous lock
// adapter and tab session. Cross-tab tests below explicitly share ControlledLocks.
export class DemoStore extends RealDemoStore {
  constructor(reports?: Report[]) {
    const tab = demoTab();
    tab.env.local = () => globalThis.localStorage;
    super(reports, tab.env);
  }
}
