import { TextEncoder, TextDecoder } from "node:util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

if (typeof global.Headers === "undefined") {
  global.Headers = class Headers {
    private map = new Map<string, string>();
    constructor(init?: any) {
      if (init) {
        if (typeof init[Symbol.iterator] === "function") {
          for (const [k, v] of init) {
            this.map.set(String(k).toLowerCase(), String(v));
          }
        } else if (typeof init === "object") {
          for (const [k, v] of Object.entries(init)) {
            this.map.set(k.toLowerCase(), String(v));
          }
        }
      }
    }
    append(name: string, value: string) { this.map.set(name.toLowerCase(), value); }
    delete(name: string) { this.map.delete(name.toLowerCase()); }
    get(name: string) { return this.map.get(name.toLowerCase()) ?? null; }
    has(name: string) { return this.map.has(name.toLowerCase()); }
    set(name: string, value: string) { this.map.set(name.toLowerCase(), value); }
    forEach(callback: (value: string, key: string, parent: any) => void) {
      this.map.forEach((v, k) => callback(v, k, this));
    }
    [Symbol.iterator]() { return this.map[Symbol.iterator](); }
    entries() { return this.map.entries(); }
    keys() { return this.map.keys(); }
    values() { return this.map.values(); }
  } as any;
}

if (typeof global.Request === "undefined") {
  global.Request = class Request {
    headers: any;
    method: string;
    url: string;
    constructor(input: any, init: any = {}) {
      this.url = typeof input === "string" ? input : (input?.url ?? "http://localhost");
      this.method = init?.method ?? "GET";
      this.headers = init?.headers ? new (global.Headers as any)(init.headers) : new (global.Headers as any)();
    }
  } as any;
}

if (typeof global.Response === "undefined") {
  global.Response = class Response {
    headers: any;
    status: number;
    statusText: string;
    constructor(body?: any, init: any = {}) {
      this.status = init?.status ?? 200;
      this.statusText = init?.statusText ?? "OK";
      this.headers = init?.headers ? new (global.Headers as any)(init.headers) : new (global.Headers as any)();
    }
  } as any;
}

if (typeof global.FormData === "undefined") {
  global.FormData = class FormData {
    private data = new Map<string, any>();
    append(name: string, value: any) { this.data.set(name, value); }
    get(name: string) { return this.data.get(name) ?? null; }
    getAll(name: string) { return this.data.has(name) ? [this.data.get(name)] : []; }
    has(name: string) { return this.data.has(name); }
    delete(name: string) { this.data.delete(name); }
  } as any;
}
