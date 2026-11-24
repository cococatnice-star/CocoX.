// One proxy engine: Scramjet -> static files in /public/scram, pages under /scram/service/.
// A separate "YouTube Player" mode plays YouTube video addresses in YouTube's own embed
// player, unproxied, because the shared relay servers get bot-checked by YouTube.

export type ProxyEngine = "scramjet" | "player";
export type ProxyMode = "scramjet" | "ytplayer";

export const SCRAMJET_PREFIX = "/scram/service/";
export const DEFAULT_WISP_SERVERS = ["wss://wisp.mercurywork.shop/", "wss://anura.pro/"];
const WISP_STORAGE_KEY = "cocox-wisp-server";
export const PROXY_MODE_KEY = "cocox-proxy-mode";
export const PROXY_MODE_EVENT = "cocox-proxy-mode-change";

/** YouTube video addresses play in YouTube's own player when the mode is "ytplayer". */
const SCRAMJET_AUTO_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com", "googlevideo.com", "ytimg.com"];

/** Reads the saved mode; old saved values from the removed Proxy 1 map to the current default. */
export function getProxyMode(): ProxyMode {
  try {
    const saved = window.localStorage.getItem(PROXY_MODE_KEY);
    if (saved === "scramjet") return "scramjet";
    if (saved === "ytplayer" || saved === "auto" || saved === "uv") return "ytplayer";
  } catch {
    /* storage unavailable */
  }
  return "ytplayer";
}

export function setProxyMode(mode: ProxyMode) {
  try {
    window.localStorage.setItem(PROXY_MODE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(PROXY_MODE_EVENT, { detail: mode }));
}

/** Is this a YouTube address (page or video)? */
export function isYouTubeUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SCRAMJET_AUTO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

/** The video id of a YouTube video address (watch, youtu.be, shorts, embed, live), or null. */
export function youTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
    const parts = u.pathname.split("/").filter(Boolean);
    let id: string | null | undefined = null;
    if (host === "youtu.be") id = parts[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parts[0] === "watch") id = u.searchParams.get("v");
      else if (["shorts", "embed", "live", "v"].includes(parts[0] ?? "")) id = parts[1];
    }
    return id && VIDEO_ID.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Seconds from a YouTube "t"/"start" value such as 90, 90s or 1h2m3s. */
function startSeconds(value: string | null) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/** YouTube's official embedded player for a video address; plays straight from the user's own connection. */
export function youTubePlayerUrl(url: string): string | null {
  const id = youTubeVideoId(url);
  if (!id) return null;
  let start = 0;
  try {
    const u = new URL(url);
    start = startSeconds(u.searchParams.get("t") ?? u.searchParams.get("start"));
  } catch {
    /* ignore */
  }
  const params = new URLSearchParams({ autoplay: "1", rel: "0", playsinline: "1" });
  if (start > 0) params.set("start", String(start));
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function engineFor(url: string, mode: ProxyMode): ProxyEngine {
  if (mode === "ytplayer" && youTubeVideoId(url)) return "player";
  return "scramjet";
}

export function toProxyUrl(url: string, engine: ProxyEngine = "scramjet") {
  if (engine === "player") return youTubePlayerUrl(url) ?? url;
  // Matches Scramjet's default codec (encodeURIComponent) and its hash handling.
  const hashAt = url.indexOf("#");
  const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const hash = hashAt >= 0 ? url.slice(hashAt + 1) : "";
  return SCRAMJET_PREFIX + encodeURIComponent(base) + (hash ? `#${encodeURIComponent(hash)}` : "");
}

/** Turns a proxied frame location (path + query) back into the real website address. */
export function fromProxyUrl(pathAndQuery: string): string | null {
  try {
    if (pathAndQuery.startsWith(SCRAMJET_PREFIX)) {
      return decodeURIComponent(pathAndQuery.slice(SCRAMJET_PREFIX.length));
    }
  } catch {
    /* malformed */
  }
  return null;
}

export function setWispServer(url: string) {
  try {
    if (url) window.localStorage.setItem(WISP_STORAGE_KEY, url);
    else window.localStorage.removeItem(WISP_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  wispServer = null;
  activeTransport = null;
  window.dispatchEvent(new CustomEvent(PROXY_MODE_EVENT));
}

export function getWispServer() {
  try {
    const saved = window.localStorage.getItem(WISP_STORAGE_KEY);
    if (saved && /^wss?:\/\//.test(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_WISP_SERVERS[0]!;
}

function probeWisp(url: string, timeoutMs = 5000) {
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean, ws?: WebSocket) => {
      if (done) return;
      done = true;
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      resolve(ok);
    };
    try {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => finish(false, ws), timeoutMs);
      ws.onmessage = () => {
        clearTimeout(timer);
        finish(true, ws);
      };
      ws.onerror = () => {
        clearTimeout(timer);
        finish(false, ws);
      };
    } catch {
      finish(false);
    }
  });
}

async function pickWispServer() {
  const preferred = getWispServer();
  const candidates = [preferred, ...DEFAULT_WISP_SERVERS.filter((s) => s !== preferred)];
  for (const server of candidates) {
    if (await probeWisp(server)) return server;
  }
  return preferred;
}

async function waitForActive(reg: ServiceWorkerRegistration) {
  if (reg.active) return;
  const worker = reg.installing ?? reg.waiting;
  if (!worker) return;
  await new Promise<void>((resolve) => {
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") resolve();
    });
  });
}

function once(start: () => Promise<void>) {
  let ready: Promise<void> | null = null;
  return () => {
    if (!ready) {
      ready = start().catch((error) => {
        ready = null;
        throw error;
      });
    }
    return ready;
  };
}

function requireServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser can't run the proxy (service workers are turned off).");
  }
}

// Scramjet uses the libcurl transport, which YouTube accepts where epoxy's HTTP/2 requests get reset.
const TRANSPORT = "/libcurl/index.mjs";
let activeTransport: string | null = null;
let wispServer: Promise<string> | null = null;

async function startTransport() {
  if (activeTransport === TRANSPORT) return;
  const { BareMuxConnection } = await import("@mercuryworkshop/bare-mux");
  const connection = new BareMuxConnection("/baremux/worker.js");
  wispServer ??= pickWispServer();
  const wisp = await wispServer;
  await connection.setTransport(TRANSPORT, [{ wisp }]);
  activeTransport = TRANSPORT;
}

type ScramjetControllerLike = { init(): Promise<void> };
type ScramjetGlobal = {
  $scramjetLoadController?: () => {
    ScramjetController: new (config: Record<string, unknown>) => ScramjetControllerLike;
  };
};

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-src="${src}"]`);
    if (existing?.dataset["loaded"] === "true") return resolve();
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => {
      script.dataset["loaded"] = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error("The proxy files couldn't load.")));
    if (!existing) {
      script.src = src;
      script.dataset["src"] = src;
      document.head.appendChild(script);
    }
  });
}

const startScramjet = once(async () => {
  requireServiceWorkers();
  await loadScript("/scram/scramjet.all.js");
  const load = (window as unknown as ScramjetGlobal).$scramjetLoadController;
  if (!load) throw new Error("The proxy couldn't start.");
  const { ScramjetController } = load();
  const controller = new ScramjetController({
    prefix: SCRAMJET_PREFIX,
    files: {
      wasm: "/scram/scramjet.wasm.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js",
    },
  });
  await controller.init();
  const reg = await navigator.serviceWorker.register("/scram/sw.js", { scope: SCRAMJET_PREFIX });
  await waitForActive(reg);
});

export async function ensureProxy(engine: ProxyEngine = "scramjet") {
  // YouTube Player mode plays videos in YouTube's own player, no proxy needed.
  if (engine === "player") return;
  await Promise.all([startScramjet(), startTransport()]);
}
