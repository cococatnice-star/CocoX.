import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  PROXY_MODE_EVENT,
  engineFor,
  ensureProxy,
  fromProxyUrl,
  getProxyMode,
  isYouTubeUrl,
  setProxyMode,
  setWispServer,
  toProxyUrl,
  type ProxyMode,
} from "./proxy";
import { ChatNoticeStack, ChatScreen, useCocoXChat } from "./ChatScreen";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Bot,
  LoaderCircle,
  Send,
  ArrowRight,
  Clapperboard,
  ExternalLink,
  Gamepad2,
  House,
  MessageCircle,
  Music2,
  Plus,
  RotateCw,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  X,
  Users,
  Wifi,
} from "lucide-react";

const shortcuts = [
  { name: "DuckDuckGo", mark: "D", style: "duck", href: "https://duckduckgo.com/" },
  { name: "YouTube", mark: "Y", style: "youtube", href: "https://www.youtube.com/" },
  { name: "ChatGPT", mark: "C", style: "chatgpt", href: "https://chatgpt.com/" },
  { name: "Discord", mark: "D", style: "discord", href: "https://discord.com/app" },
  { name: "TikTok", mark: "T", style: "tiktok", href: "https://www.tiktok.com/" },
];

const GAMES_SCREEN = "cocox://games";
const ALL_GAMES_SCREEN = "cocox://all-games";
const OMEGLE_SCREEN = "cocox://omegle";
const MUSIC_SCREEN = "cocox://music";
const MOVIES_SCREEN = "cocox://movies";
const CHAT_SCREEN = "cocox://chat";
const SETTINGS_SCREEN = "cocox://settings";
const ONLINE_SCREEN = "cocox://online";
const AI_SCREEN = "cocox://ai";

const homeTaglines = [
  "CocoX on Top",
  "LOL YOU CANT BLOCK THIS",
  "Welcome to the CocoX zone",
];

const dockItems = [
  { name: "home", icon: House },
  { name: "games", icon: Gamepad2 },
  { name: "music", icon: Music2 },
  { name: "movies", icon: Clapperboard },
  { name: "chat", icon: MessageCircle },
  { name: "ai", icon: Sparkles },
  { name: "shop", icon: ShoppingBag },
  { name: "online people", icon: Users },
  { name: "settings", icon: Settings },
];

type BrowserTab = { id: number; url: string; shown?: string | undefined };

export function normalizeAddress(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:\/\/|about:blank)/i.test(value)) return value;
  if (/^(localhost|[\w-]+\.[a-z]{2,})(:\d+)?([/?#].*)?$/i.test(value)) return `https://${value}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(value)}`;
}

function tabTitle(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || "New tab";
  } catch {
    return "New tab";
  }
}

function ChristmasSnowfall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const flakes: Array<{ x: number; y: number; radius: number; speed: number; drift: number; phase: number; opacity: number }> = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let wind = 0;

    const randomize = (flake: typeof flakes[number], initial = false) => {
      flake.x = Math.random() * width;
      flake.y = initial ? Math.random() * height : -12;
      flake.radius = 0.7 + Math.random() * 2.5;
      flake.speed = 22 + Math.random() * 66;
      flake.drift = 7 + Math.random() * 24;
      flake.phase = Math.random() * Math.PI * 2;
      flake.opacity = 0.28 + Math.random() * 0.68;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(190, Math.max(65, Math.round(width * height / 6200)));
      // Setting array.length only creates empty slots, not flake objects.
      // Create each flake before randomize() writes its position and physics.
      flakes.splice(
        0,
        flakes.length,
        ...Array.from({ length: count }, () => ({
          x: 0,
          y: 0,
          radius: 0,
          speed: 0,
          drift: 0,
          phase: 0,
          opacity: 0,
        })),
      );
      for (const flake of flakes) randomize(flake, true);
    };

    const draw = (time: number) => {
      const delta = Math.min((time - (lastTime || time)) / 1000, 0.04);
      lastTime = time;
      wind = Math.sin(time * 0.00019) * 17 + Math.sin(time * 0.000071) * 11;
      context.clearRect(0, 0, width, height);

      for (const flake of flakes) {
        flake.phase += delta * (0.45 + flake.speed / 100);
        flake.y += flake.speed * delta;
        flake.x += (wind * 0.28 + Math.sin(flake.phase) * flake.drift) * delta;
        if (flake.y - flake.radius > height || flake.x < -18 || flake.x > width + 18) {
          randomize(flake);
          if (flake.x > width / 2) flake.x = Math.random() * width;
        }

        const depth = flake.radius / 3.2;
        context.beginPath();
        context.fillStyle = `rgba(255,255,255,${flake.opacity})`;
        context.shadowColor = "rgba(224,241,255,.8)";
        context.shadowBlur = flake.radius * 2.4;
        context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        context.fill();

        if (flake.speed > 70 && flake.radius > 2 && Math.abs(wind) > 8) {
          context.beginPath();
          context.strokeStyle = `rgba(235,246,255,${flake.opacity * 0.28})`;
          context.lineWidth = 0.7;
          context.moveTo(flake.x, flake.y);
          context.lineTo(flake.x - wind * 0.035, flake.y - 5 * depth);
          context.stroke();
        }
      }
      context.shadowBlur = 0;
      if (!reducedMotion) frame = window.requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    if (reducedMotion) draw(0);
    else frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="christmas-snowfall" aria-hidden="true" />;
}

function Home({ openSite }: { openSite: (url: string) => void }) {
  const [search, setSearch] = useState("");
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTaglineIndex((current) => (current + 1) % homeTaglines.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    const url = normalizeAddress(search);
    if (url) openSite(url);
  }
  return (
    <>
      <div className="space-scene christmas-scene" aria-hidden="true">
        <div className="starfield" />
        <ChristmasSnowfall />
        <div className="holiday-lights" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="aurora aurora-green" />
        <div className="aurora aurora-red" />
        <div className="aurora aurora-glow" />
      </div>
      <section className="home-content christmas-home">
        <div className="oxygen-brand">
          <h1><span className="santa-c"><span className="santa-hat" aria-hidden="true"><i /></span>C</span>ocoX.wtf</h1>
        </div>
        <p className="tagline tagline-animated" key={taglineIndex}>{homeTaglines[taglineIndex]}</p>
        <form className="searchbar" onSubmit={submit} role="search">
          <Search size={17} className="search-icon" aria-hidden="true" />
          <input
            className="search-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or enter a website address"
            aria-label="Search or enter a website address"
            data-testid="input-web-search"
          />
          <button className="search-go" type="submit" aria-label="Search" data-testid="button-search">
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="shortcuts" aria-label="Popular websites">
          {shortcuts.map((site) => (
            <button
              className="shortcut-chip"
              type="button"
              onClick={() => openSite(site.href)}
              key={site.name}
              aria-label={`Open ${site.name}`}
              data-testid={`link-${site.name.toLowerCase()}`}
            >
              <span className={`shortcut-mark ${site.style}`}>{site.mark}</span>
              <span>{site.name}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="date-line">Thursday, November 12th, 2026</div>
    </>
  );
}

function BrowserWindow({
  tabs,
  activeId,
  setActiveId,
  openTab,
  closeTab,
  navigate,
  markShown,
  goHome,
}: {
  tabs: BrowserTab[];
  activeId: number;
  setActiveId: (id: number) => void;
  openTab: () => void;
  closeTab: (id: number) => void;
  navigate: (url: string) => void;
  markShown: (url: string) => void;
  goHome: () => void;
}) {
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const [address, setAddress] = useState(active?.shown ?? active?.url ?? "about:blank");
  const [reload, setReload] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [proxyState, setProxyState] = useState<"starting" | "ready" | "error">("starting");
  const [proxyError, setProxyError] = useState("");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const url = active?.url ?? "about:blank";
  const shownUrl = active?.shown ?? url;
  const [proxyMode, setMode] = useState<ProxyMode>("ytplayer");
  const engine = engineFor(url, proxyMode);
  // Page to return to when pressing Back while a video plays in YouTube Player mode.
  const beforePlayer = useRef<string | null>(null);

  useEffect(() => {
    setMode(getProxyMode());
    const onChange = () => setMode(getProxyMode());
    window.addEventListener(PROXY_MODE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROXY_MODE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProxyState("starting");
    ensureProxy(engine)
      .then(() => !cancelled && setProxyState("ready"))
      .catch((error: unknown) => {
        if (cancelled) return;
        setProxyError(error instanceof Error ? error.message : "The proxy couldn't start.");
        setProxyState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reload, engine]);

  const lastShown = useRef(shownUrl);
  useEffect(() => {
    if (proxyState !== "ready") return;
    const timer = window.setInterval(frameLoaded, 1000);
    return () => window.clearInterval(timer);
  });

  function frameLoaded() {
    try {
      const loc = frameRef.current?.contentWindow?.location;
      if (!loc) return;
      const real = fromProxyUrl(loc.pathname + loc.search);
      if (real) {
        const full = real + loc.hash;
        if (full === lastShown.current) return;
        lastShown.current = full;
        setAddress(full);
        if (engineFor(full, proxyMode) === "player") {
          // A video was opened inside YouTube: play it in YouTube's own player instead.
          beforePlayer.current = shownUrl;
          navigate(full);
          return;
        }
        markShown(full);
      }
    } catch {
      /* frame not readable yet */
    }
  }
  function frameHistory(step: -1 | 1) {
    if (engine === "player") {
      if (step === -1) {
        const back = beforePlayer.current ?? "https://www.youtube.com/";
        beforePlayer.current = null;
        navigate(back);
        setAddress(back);
      }
      return;
    }
    try {
      frameRef.current?.contentWindow?.history.go(step);
    } catch {
      /* ignore */
    }
  }

  function go(raw: string) {
    const next = normalizeAddress(raw);
    if (next) {
      navigate(next);
      setAddress(next);
      setShowHelp(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    go(address);
  }

  return (
    <section className="browser-window" aria-label="CocoX.wtf browser">
      <div className="tab-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`browser-tab ${tab.id === activeId ? "active" : ""}`}
            onClick={() => {
              setActiveId(tab.id);
              setAddress(tab.shown ?? tab.url);
            }}
          >
            <span className="tab-dot" />
            <span className="tab-title">
              {tab.url === "about:blank" ? "New tab" : tabTitle(tab.shown ?? tab.url)}
            </span>
            <X
              size={13}
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
            />
          </button>
        ))}
        <button type="button" className="new-tab" aria-label="New tab" onClick={openTab}>
          <Plus size={17} />
        </button>
      </div>
      <div className="address-row">
        <div className="browser-controls">
          <button aria-label="Back" onClick={() => frameHistory(-1)}>
            <ArrowLeft size={15} />
          </button>
          <button aria-label="Forward" onClick={() => frameHistory(1)}>
            <ArrowRight size={15} />
          </button>
          <button aria-label="Reload" onClick={() => setReload((n) => n + 1)}>
            <RotateCw size={15} />
          </button>
          <button aria-label="Home" onClick={goHome}>
            <House size={15} />
          </button>
        </div>
        <form className="address-bar" onSubmit={submit}>
          <input
            aria-label="Website address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button type="submit" aria-label="Go">
            <ArrowRight size={14} />
          </button>
        </form>
        <button
          className="external-open"
          type="button"
          aria-label="Open current website in a regular browser tab"
          onClick={() => {
            if (url !== "about:blank") window.open(shownUrl, "_blank", "noopener,noreferrer");
          }}
        >
          <ExternalLink size={15} />
        </button>
      </div>
      {url === "about:blank" ? (
        <div className="browser-empty">
          <div className="empty-card">
            <h2>New tab</h2>
            <p>
              Enter a website address or search words above. Some websites may need to open in a
              regular browser tab.
            </p>
          </div>
        </div>
      ) : (
        <div className="browser-page">
          {proxyState === "ready" ? (
            <iframe
              ref={frameRef}
              key={`${activeId}-${url}-${reload}-${engine}`}
              src={toProxyUrl(url, engine)}
              onLoad={frameLoaded}
              title={`CocoX.wtf browser: ${tabTitle(shownUrl)}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="browser-empty">
              <div className="empty-card">
                <h2>{proxyState === "starting" ? "Starting proxy…" : "Proxy couldn't start"}</h2>
                <p>
                  {proxyState === "starting"
                    ? "Connecting to the proxy server. This only takes a second."
                    : `${proxyError} Press reload to try again.`}
                </p>
              </div>
            </div>
          )}
          <div className="embed-note">
            <span>
              {engine === "player"
                ? "Playing in YouTube Player (uses your own connection)."
                : "Browsing through Scramjet."}
            </span>
            {engine === "player" && (
              <button type="button" onClick={() => setProxyMode("scramjet")}>
                Play through Scramjet
              </button>
            )}
            {engine !== "player" && isYouTubeUrl(url) && proxyMode !== "ytplayer" && (
              <button type="button" onClick={() => setProxyMode("ytplayer")}>
                Use YouTube Player
              </button>
            )}
            <button type="button" onClick={() => setShowHelp((v) => !v)}>
              Page not loading?
            </button>
            {showHelp && (
              <p>
                Press reload to retry. Some sites with heavy security checks may still refuse to load
                through a proxy; use the external-open icon to open them in a regular browser tab.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function LaunchCocoX({ onLaunch }: { onLaunch: () => void }) {
  return (
    <main className="oxygen-page" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: 24, boxSizing: "border-box" }}>
      <section style={{ width: "min(100%, 420px)", textAlign: "center" }}>
        <div className="oxygen-brand" style={{ marginBottom: 12 }}>
          <span className="oxygen-accent" />
          <h1>CocoX.wtf</h1>
        </div>
        <p className="tagline" style={{ fontSize: 13, marginBottom: 24 }}>
          Your browser, your way.
        </p>
        <button
          type="button"
          onClick={onLaunch}
          style={{ padding: "12px 22px", border: "1px solid #45454b", borderRadius: 10, background: "#f1f1f2", color: "#111", fontWeight: 700, cursor: "pointer" }}
        >
          Launch CocoX
        </button>
      </section>
    </main>
  );
}

export function CocoXApp() {
  const [launched, setLaunched] = useState(false);

  // /index.html is the direct launch entry point for CocoX.
  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, "") === "/index.html") {
      setLaunched(true);
    }
  }, []);

  const launchCocoX = () => {
    // Must run synchronously from the button click so popup blockers allow it.
    // Open the explicit index.html URL without adding a query parameter.
    const launchUrl = new URL("/index.html", window.location.origin);
    const opened = window.open(launchUrl.toString(), "_blank");
    if (!opened) {
      window.alert("Please allow pop-ups for this site, then press Launch CocoX again.");
    }
  };

  if (!launched) return <LaunchCocoX onLaunch={launchCocoX} />;
  return <CocoXBrowserApp />;
}

type AIMessage = { role: "user" | "assistant"; content: string };

function AIScreen({ goHome }: { goHome: () => void }) {
  const [model, setModel] = useState(() => typeof window !== "undefined" ? localStorage.getItem("cocox-openrouter-model") || "openai/gpt-4o-mini" : "openai/gpt-4o-mini");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = prompt.trim();
    if (!content || busy) return;
    const nextMessages: AIMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setPrompt("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.trim() || "openai/gpt-4o-mini", messages: nextMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `CocoX AI returned HTTP ${response.status}.`);
      const answer = data?.answer;
      if (typeof answer !== "string" || !answer.trim()) throw new Error("The selected model returned an empty response.");
      setMessages([...nextMessages, { role: "assistant", content: answer.trim() }]);
    } catch (err) {
      setMessages(nextMessages);
      setError(err instanceof Error ? err.message : "Couldn't contact CocoX AI. Check the server's idk.env file and model.");
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    setMessages([]);
    setError("");
    setPrompt("");
  }

  return <section className="cocox-ai-screen">
    <header className="ai-header">
      <button className="settings-back" onClick={goHome}><ArrowLeft size={16}/> Home</button>
      <div className="ai-brand"><span className="ai-brand-icon"><Sparkles size={18}/></span><div><span className="settings-kicker">POWERED BY OPENROUTER</span><h1>CocoX AI</h1><p>Chat with models from across the AI universe.</p></div></div>
      <div className="ai-header-actions">
        <button type="button" className="ai-icon-button" onClick={newChat} title="New chat" aria-label="New chat"><Plus size={17}/></button>
      </div>
    </header>
    <div className="ai-model-row"><span><span className="online-live-dot"/> Server-connected AI</span><label>Model <input aria-label="OpenRouter model ID" value={model} onChange={e=>{setModel(e.target.value);localStorage.setItem("cocox-openrouter-model",e.target.value);}} /></label><a href="https://openrouter.ai/models" target="_blank" rel="noreferrer">Browse models <ExternalLink size={11}/></a></div>
    <div className="ai-chat-area" ref={scrollRef}>
      {messages.length === 0 ? <div className="ai-empty-state"><div className="ai-empty-orb"><Bot size={34}/></div><h2>What can I help with?</h2><p>Ask CocoX AI anything. Your selected OpenRouter model will answer.</p><div className="ai-suggestions">{["Explain something simply", "Help me write code", "Give me creative ideas"].map(item=><button type="button" key={item} onClick={()=>setPrompt(item)}>{item}<ArrowRight size={13}/></button>)}</div></div> : <div className="ai-messages">{messages.map((message,index)=><article className={`ai-message ${message.role}`} key={`${index}-${message.role}`}><div className="ai-message-avatar">{message.role === "assistant" ? <Sparkles size={15}/> : "You"}</div><div className="ai-message-content"><span>{message.role === "assistant" ? "CocoX AI" : "You"}</span><p>{message.content}</p></div></article>)}{busy && <article className="ai-message assistant"><div className="ai-message-avatar"><Sparkles size={15}/></div><div className="ai-message-content"><span>CocoX AI</span><p className="ai-thinking"><LoaderCircle size={15}/> Thinking…</p></div></article>}</div>}
    </div>
    {error && <p className="ai-error" role="alert">{error}</p>}
    <form className="ai-composer" onSubmit={sendMessage}><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();e.currentTarget.form?.requestSubmit();}}} placeholder="Message CocoX AI…" rows={1} aria-label="Message CocoX AI"/><button type="submit" disabled={busy || !prompt.trim()} aria-label="Send message">{busy?<LoaderCircle size={17} className="ai-spin"/>:<Send size={17}/>}</button></form>
    <p className="ai-disclaimer">AI responses can be inaccurate. Model usage may cost money depending on your OpenRouter account.</p>
  </section>;
}

function SettingsScreen({ goHome }: { goHome: () => void }) {
  const presets = ["#ff7a00", "#ff4d00", "#ff9f1c", "#ff3b5c", "#a855f7", "#3b82f6", "#06b6d4", "#ec4899", "#ffffff"];
  const [accent, setAccent] = useState(() => (typeof window !== "undefined" && localStorage.getItem("cocox-accent")) || "#ff7a00");
  const [background, setBackground] = useState(() => (typeof window !== "undefined" && localStorage.getItem("cocox-background")) || "space");
  const [glass, setGlass] = useState(() => typeof window === "undefined" || localStorage.getItem("cocox-glass") !== "false");
  const [motion, setMotion] = useState(() => typeof window === "undefined" || localStorage.getItem("cocox-motion") !== "false");
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && localStorage.getItem("cocox-compact") === "true");
  const [showShortcuts, setShowShortcuts] = useState(() => typeof window === "undefined" || localStorage.getItem("cocox-shortcuts") !== "false");
  const [fontSize, setFontSize] = useState(() => Number((typeof window !== "undefined" && localStorage.getItem("cocox-font-size")) || 100));
  const [proxyMode, setProxyModeState] = useState<ProxyMode>("ytplayer");
  const [relay, setRelay] = useState("");
  useEffect(() => { setProxyModeState(getProxyMode()); setRelay(localStorage.getItem("cocox-wisp-server") ?? ""); }, []);
  function saveRelay(value: string) { const v = value.trim(); if (v && !/^wss?:\/\//.test(v)) return; setWispServer(v); }
  function chooseProxy(mode: ProxyMode) { setProxyModeState(mode); setProxyMode(mode); }
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--cocox-accent", accent);
    root.style.setProperty("--cocox-font-scale", `${fontSize / 100}`);
    root.dataset["cocoxBackground"] = background;
    root.dataset["cocoxGlass"] = String(glass);
    root.dataset["cocoxMotion"] = String(motion);
    root.dataset["cocoxCompact"] = String(compact);
    root.dataset["cocoxShortcuts"] = String(showShortcuts);
    localStorage.setItem("cocox-accent", accent);
    localStorage.setItem("cocox-background", background);
    localStorage.setItem("cocox-glass", String(glass));
    localStorage.setItem("cocox-motion", String(motion));
    localStorage.setItem("cocox-compact", String(compact));
    localStorage.setItem("cocox-shortcuts", String(showShortcuts));
    localStorage.setItem("cocox-font-size", String(fontSize));
  }, [accent, background, glass, motion, compact, showShortcuts, fontSize]);
  function reset() {
    setAccent("#ff7a00"); setBackground("space"); setGlass(true); setMotion(true);
    setCompact(false); setShowShortcuts(true); setFontSize(100); chooseProxy("ytplayer");
  }
  return <section className="settings-screen">
    <header className="settings-header"><button className="settings-back" onClick={goHome}><ArrowLeft size={16}/> Home</button><div><span className="settings-kicker">COCOX CONTROL CENTER</span><h1>Customize CocoX</h1><p>Make your browser look and feel exactly how you want.</p></div></header>
    <div className="settings-grid">
      <section className="settings-card"><h2>Appearance color</h2><p>Choose your accent color for buttons, highlights and active icons.</p>
        <div className="settings-swatches">{presets.map(color => <button key={color} aria-label={`Choose ${color}`} title={color} className={`settings-swatch ${accent.toLowerCase()===color ? "active" : ""}`} style={{background:color}} onClick={()=>setAccent(color)}/>)}</div>
        <label className="settings-field">Custom color <input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/><code>{accent.toUpperCase()}</code></label>
      </section>
      <section className="settings-card"><h2>Background</h2><p>Pick the look behind your home screen.</p><div className="settings-options">
        {[{id:"space",name:"Space stars"},{id:"dark",name:"Pure black"},{id:"gradient",name:"Soft gradient"},{id:"orange",name:"Orange glow"}].map(item=><button key={item.id} className={`settings-option ${background===item.id?"active":""}`} onClick={()=>setBackground(item.id)}>{item.name}{background===item.id&&<span>✓</span>}</button>)}
      </div></section>
      <section className="settings-card"><h2>Interface</h2><p>Adjust the way CocoX is displayed.</p>
        <label className="settings-toggle"><span><b>Liquid glass dock</b><small>Use a translucent blurred navigation bar</small></span><input type="checkbox" checked={glass} onChange={e=>setGlass(e.target.checked)}/></label>
        <label className="settings-toggle"><span><b>Animations</b><small>Enable smooth transitions and entrance effects</small></span><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/></label>
        <label className="settings-toggle"><span><b>Compact navigation</b><small>Make the bottom dock smaller</small></span><input type="checkbox" checked={compact} onChange={e=>setCompact(e.target.checked)}/></label>
        <label className="settings-toggle"><span><b>Home shortcuts</b><small>Show DuckDuckGo, YouTube and other shortcuts</small></span><input type="checkbox" checked={showShortcuts} onChange={e=>setShowShortcuts(e.target.checked)}/></label>
        <label className="settings-field settings-range">Website text size <strong>{fontSize}%</strong><input type="range" min="80" max="125" step="5" value={fontSize} onChange={e=>setFontSize(Number(e.target.value))}/></label>
      </section>
      <section className="settings-card"><h2>Proxy</h2><p>CocoX opens websites through one proxy: Scramjet. Choose whether YouTube videos play in YouTube's own player instead.</p><div className="settings-options">
        {([{id:"ytplayer",name:"Scramjet + YouTube Player — YouTube videos play in YouTube's own player (no bot check), every other page through Scramjet"},{id:"scramjet",name:"Scramjet for all sites — YouTube videos go through the proxy too"}] as const).map(item=><button key={item.id} className={`settings-option ${proxyMode===item.id?"active":""}`} onClick={()=>chooseProxy(item.id)}>{item.name}{proxyMode===item.id&&<span>✓</span>}</button>)}
      </div>
        <label className="settings-field">Proxy server (optional) <input type="text" placeholder="wss://your-server.com/" value={relay} onChange={e=>setRelay(e.target.value)} onBlur={e=>saveRelay(e.target.value)} style={{flex:1,minWidth:0}}/></label>
        <p style={{fontSize:12,opacity:.75}}>Leave empty to use the free CocoX servers. Paste your own wss:// server here, then press reload in the browser.</p>
      </section>
      <section className="settings-card settings-preview"><h2>Live preview</h2><p>Your accent color is applied across CocoX.</p><button className="settings-preview-button">CocoX button preview</button><span className="settings-preview-dot" style={{background:accent}}/></section>
    </div>
    <button className="settings-reset" onClick={reset}>Reset all settings</button>
  </section>;
}

function CocoXPresenceTracker({
  onCount,
  onStatus,
}: {
  onCount: (count: number) => void;
  onStatus: (status: "connecting" | "live" | "offline") => void;
}) {
  useEffect(() => {
    if (!supabase) {
      onStatus("offline");
      return;
    }

    let alive = true;
    let channel: RealtimeChannel | null = null;
    const updateCount = () => {
      if (!alive || !channel) return;
      const presence = channel.presenceState();
      const total = Object.values(presence).reduce(
        (sum, sessions) => sum + sessions.length,
        0,
      );
      onCount(total);
    };

    // One shared channel both publishes this browser's presence and observes
    // the room. Opening the Online People screen must not create a second
    // subscription to the same topic.
    let presenceKey = "";
    try {
      const keyName = "cocox-online-presence-id";
      presenceKey = sessionStorage.getItem(keyName) || "";
      if (!presenceKey) {
        presenceKey = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(keyName, presenceKey);
      }
    } catch {
      presenceKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    channel = supabase.channel("cocox-online-people", {
      config: { presence: { key: presenceKey } },
    });

    channel
      .on("presence", { event: "sync" }, updateCount)
      .subscribe(async (subscriptionStatus) => {
        if (!alive) return;
        if (subscriptionStatus === "SUBSCRIBED") {
          onStatus("live");
          updateCount();
          try {
            await channel?.track({ online_at: new Date().toISOString() });
          } catch (error) {
            console.error("CocoX presence tracking failed:", error);
          }
        } else if (
          subscriptionStatus === "CHANNEL_ERROR" ||
          subscriptionStatus === "TIMED_OUT" ||
          subscriptionStatus === "CLOSED"
        ) {
          onStatus("offline");
        }
      });

    return () => {
      alive = false;
      if (channel) void supabase?.removeChannel(channel);
    };
  }, [onCount, onStatus]);

  return null;
}

function OnlinePeopleScreen({
  goHome,
  count,
  status,
}: {
  goHome: () => void;
  count: number | null;
  status: "connecting" | "live" | "offline";
}) {
  return <section className="online-people-screen">
    <header className="settings-header"><button className="settings-back" onClick={goHome}><ArrowLeft size={16}/> Home</button><div><span className="settings-kicker">COCOX COMMUNITY</span><h1>Online People</h1><p>See how many people are currently using CocoX.</p></div></header>
    <div className="online-board" aria-live="polite">
      <div className="online-board-top"><span className="online-live-dot"/><span>{status === "live" ? "LIVE BOARD" : status === "connecting" ? "CONNECTING" : "OFFLINE"}</span><Wifi size={17}/></div>
      <div className="online-count">{count === null ? "—" : count}</div>
      <h2>People Online</h2>
      <p>{status === "live" ? "Live count of active CocoX sessions" : status === "connecting" ? "Connecting to the live people counter…" : "Live count is unavailable. Check the Supabase connection settings."}</p>
      {status === "live" && <div className="online-people-list">{Array.from({ length: count ?? 0 }, (_, index) => <span className="online-person" key={index}><span className="online-person-dot"/> Person {index + 1}</span>)}</div>}
    </div>
    <p className="online-footnote">The number updates automatically as CocoX visitors connect and leave. Each browser session counts once.</p>
  </section>;
}

function CocoXBrowserApp() {
  const chat = useCocoXChat();
  const [ownerPromptOpen, setOwnerPromptOpen] = useState(false);
  const [ownerKeyInput, setOwnerKeyInput] = useState("");
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);
  const [ownerError, setOwnerError] = useState("");
  const [ownerChannelReady, setOwnerChannelReady] = useState(false);
  const [broadcastStartedAt, setBroadcastStartedAt] = useState<number | null>(null);
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);
  const broadcastVideoRef = useRef<HTMLVideoElement>(null);
  const ownerChannelRef = useRef<RealtimeChannel | null>(null);

  // Ctrl+E opens the owner-key prompt from anywhere in CocoX.
  useEffect(() => {
    const handleOwnerShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setOwnerPromptOpen(true);
      }
    };
    window.addEventListener("keydown", handleOwnerShortcut);
    return () => window.removeEventListener("keydown", handleOwnerShortcut);
  }, []);

  // Supabase Broadcast sends play/stop commands to every connected CocoX visitor.
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const channel = supabase.channel("cocox-owner-video", { config: { broadcast: { self: true } } });
    ownerChannelRef.current = channel;
    channel
      .on("broadcast", { event: "video-control" }, ({ payload }) => {
        if (!alive || !payload) return;
        if (payload.action === "play" && Number.isFinite(Number(payload.startedAt))) {
          setBroadcastStartedAt(Number(payload.startedAt));
          setAudioNeedsGesture(false);
        } else if (payload.action === "stop") {
          setBroadcastStartedAt(null);
        }
      })
      .subscribe((status) => {
        if (!alive) return;
        setOwnerChannelReady(status === "SUBSCRIBED");
      });
    return () => {
      alive = false;
      ownerChannelRef.current = null;
      void supabase?.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const video = broadcastVideoRef.current;
    if (!video || broadcastStartedAt === null) return;
    let cancelled = false;
    const syncAndPlay = async () => {
      const elapsed = Math.max(0, (Date.now() - broadcastStartedAt) / 1000);
      if (Number.isFinite(video.duration) && video.duration > 0 && elapsed >= video.duration) {
        setBroadcastStartedAt(null);
        return;
      }
      try {
        video.currentTime = elapsed;
        video.muted = false;
        video.volume = 1;
        await video.play();
        if (!cancelled) setAudioNeedsGesture(false);
      } catch {
        // Browsers may block audible autoplay until the visitor interacts once.
        if (!cancelled) setAudioNeedsGesture(true);
      }
    };
    if (video.readyState >= 1) void syncAndPlay();
    else video.addEventListener("loadedmetadata", syncAndPlay, { once: true });
    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", syncAndPlay);
    };
  }, [broadcastStartedAt]);

  // Keep the broadcast in front of the CocoX app and intercept in-app back navigation.
  // Browser chrome and closing the tab remain under the visitor's control.
  useEffect(() => {
    if (broadcastStartedAt === null) return;
    const trapHistory = () => {
      window.history.pushState({ cocoxBroadcast: true }, "", window.location.href);
    };
    const handlePopState = () => trapHistory();
    const handleBroadcastKeys = (event: KeyboardEvent) => {
      if ((event.altKey && event.key === "ArrowLeft") || event.key === "Backspace" || event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        trapHistory();
      }
    };
    trapHistory();
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleBroadcastKeys, true);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleBroadcastKeys, true);
    };
  }, [broadcastStartedAt]);

  function unlockOwner(event: FormEvent) {
    event.preventDefault();
    if (ownerKeyInput === "12300") {
      setOwnerUnlocked(true);
      setOwnerError("");
      setOwnerKeyInput("");
    } else {
      setOwnerError("Incorrect owner key.");
    }
  }

  async function sendVideoCommand(action: "play" | "stop") {
    const channel = ownerChannelRef.current;
    if (!channel || !ownerChannelReady) {
      setOwnerError("Live control is not connected. Refresh and try again.");
      return;
    }
    const startedAt = Date.now() + 1200;
    const payload = action === "play" ? { action, startedAt } : { action };
    const result = await channel.send({ type: "broadcast", event: "video-control", payload });
    if (result !== "ok") {
      setOwnerError("Could not send the command. Check your Supabase Realtime settings.");
      return;
    }
    if (action === "play") setBroadcastStartedAt(startedAt);
    else setBroadcastStartedAt(null);
    setOwnerError("");
  }


  // Keep the leave confirmation active throughout CocoX, regardless of which
  // screen is open (Home, Chat, Games, Music, Movies, Settings, etc.).
  useEffect(() => {
    const confirmLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, []);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [onlineStatus, setOnlineStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeId, setActiveId] = useState(0);
  const [nextId, setNextId] = useState(1);
  const browsing = tabs.length > 0;

  function openSite(url: string) {
    const id = nextId;
    setNextId(id + 1);
    setTabs((prev) => [...prev, { id, url }]);
    setActiveId(id);
  }
  function openTab() {
    openSite("about:blank");
  }
  function navigate(url: string) {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeId ? { ...tab, url, shown: undefined } : tab)),
    );
  }
  function markShown(shown: string) {
    setTabs((prev) => prev.map((tab) => (tab.id === activeId ? { ...tab, shown } : tab)));
  }
  function closeTab(id: number) {
    setTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== id);
      if (!next.length) setActiveId(0);
      else if (id === activeId) setActiveId(next[next.length - 1]!.id);
      return next;
    });
  }
  function goHome() {
    setTabs([]);
    setActiveId(0);
  }

  return (
    <>
      <CocoXPresenceTracker onCount={setOnlineCount} onStatus={setOnlineStatus} />
      <main className={`oxygen-page ${browsing ? "is-browsing" : ""}`}>
      {!browsing ? (
        <header className="browser-chrome home-chrome" aria-label="Browser frame">
          <div className="tab-row">
            <div className="browser-tab active">
              <span className="tab-dot" />
              <span className="tab-title">Home</span>
            </div>
            <button className="new-tab" type="button" aria-label="New tab" onClick={openTab}>
              <Plus size={17} />
            </button>
          </div>
          <div className="address-row">
            <div className="browser-controls">
              <button aria-label="Home" onClick={goHome}>
                <House size={15} />
              </button>
            </div>
            <div className="address-bar">
              <span>cocox://home</span>
            </div>
          </div>
        </header>
      ) : tabs.find((tab) => tab.id === activeId)?.url === SETTINGS_SCREEN ? (
        <section className="browser-window" aria-label="CocoX Settings"><div className="settings-tabbar"><span>⚙ CocoX Settings</span><button onClick={goHome}>×</button></div><SettingsScreen goHome={goHome} /></section>
      ) : tabs.find((tab) => tab.id === activeId)?.url === ONLINE_SCREEN ? (
        <OnlinePeopleScreen goHome={goHome} count={onlineCount} status={onlineStatus} />
      ) : tabs.find((tab) => tab.id === activeId)?.url === AI_SCREEN ? (
        <AIScreen goHome={goHome} />
      ) : tabs.find((tab) => tab.id === activeId)?.url === CHAT_SCREEN ? (
        <ChatScreen chat={chat} goHome={goHome} />
      ) : tabs.find((tab) => tab.id === activeId)?.url === MUSIC_SCREEN ? (
        <section className="browser-window" aria-label="CocoX Music">
          <div className="tab-row">
            <button className="new-tab" type="button" aria-label="Return to home" title="Return to home" onClick={goHome}>
              <Plus size={17} />
            </button>
          </div>
          <div className="games-embedded-page">
            <iframe
              src="https://cocox-idk.onrender.com/spotify-player.html#/home"
              title="CocoX Music Player"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </section>
      ) : tabs.find((tab) => tab.id === activeId)?.url === MOVIES_SCREEN ? (
        <section className="browser-window" aria-label="CocoX Movies">
          <div className="tab-row">
            <button className="new-tab" type="button" aria-label="Return to home" title="Return to home" onClick={goHome}>
              <Plus size={17} />
            </button>
          </div>
          <div className="games-embedded-page">
            <iframe
              src="/netflix-player.html"
              title="CocoX Movies"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          </div>
        </section>
      ) : tabs.find((tab) => tab.id === activeId)?.url === GAMES_SCREEN ? (
        <section className="browser-window" aria-label="Games screen">
          <div className="tab-row">
            <button className="new-tab" type="button" aria-label="Return to home" title="Return to home" onClick={goHome}>
              <Plus size={17} />
            </button>
          </div>
          <div className="games-screen">
            <div className="games-launch-group">
              <button className="games-launch-button" type="button" onClick={() => openSite(OMEGLE_SCREEN)}>
                Omegle
              </button>
              <button className="games-launch-button" type="button" onClick={() => openSite(ALL_GAMES_SCREEN)}>
                All Games
              </button>
            </div>
          </div>
        </section>
      ) : tabs.find((tab) => tab.id === activeId)?.url === ALL_GAMES_SCREEN ? (
        <section className="browser-window" aria-label="All Games">
          <div className="tab-row">
            <button className="new-tab" type="button" aria-label="Return to Games" title="Return to Games" onClick={() => openSite(GAMES_SCREEN)}>
              <Gamepad2 size={17} />
            </button>
            <span className="tab-title">All Games</span>
          </div>
          <div className="games-embedded-page">
            <iframe
              src="https://classroom-6x.io/home/"
              title="All Games"
              allow="autoplay; fullscreen; gamepad"
              allowFullScreen
            />
          </div>
        </section>
      ) : tabs.find((tab) => tab.id === activeId)?.url === OMEGLE_SCREEN ? (
        <section className="browser-window" aria-label="Omegle page">
          <div className="tab-row">
            <button className="new-tab" type="button" aria-label="Return to home" title="Return to home" onClick={goHome}>
              <Plus size={17} />
            </button>
          </div>
          <div className="games-embedded-page">
            <iframe src="https://xn--r8j.icu/storage/omegle.html" title="CocoX" allow="fullscreen" />
          </div>
        </section>
      ) : (
        <BrowserWindow
          key={activeId}
          tabs={tabs}
          activeId={activeId}
          setActiveId={setActiveId}
          openTab={openTab}
          closeTab={closeTab}
          navigate={navigate}
          markShown={markShown}
          goHome={goHome}
        />
      )}
      {!browsing && <Home openSite={openSite} />}
      <nav className="bottom-dock" aria-label="Home navigation">
        {dockItems.map(({ name, icon: Icon }) => {
          const selected =
            (name === "home" && !browsing) ||
            (name === "games" && tabs.some((tab) => tab.url === GAMES_SCREEN)) ||
            (name === "chat" && tabs.some((tab) => tab.url === CHAT_SCREEN)) ||
            (name === "ai" && tabs.some((tab) => tab.url === AI_SCREEN)) ||
            (name === "online people" && tabs.some((tab) => tab.url === ONLINE_SCREEN)) ||
            (name === "settings" && tabs.some((tab) => tab.url === SETTINGS_SCREEN));
          return (
            <button
              type="button"
              className={`dock-item${selected ? " selected" : ""}`}
              key={name}
              aria-label={name}
              onClick={name === "home" ? goHome : name === "games" ? () => openSite(GAMES_SCREEN) : name === "music" ? () => openSite(MUSIC_SCREEN) : name === "movies" ? () => openSite(MOVIES_SCREEN) : name === "chat" ? () => { openSite(CHAT_SCREEN); chat.markRead(); } : name === "ai" ? () => openSite(AI_SCREEN) : name === "online people" ? () => openSite(ONLINE_SCREEN) : name === "settings" ? () => openSite(SETTINGS_SCREEN) : undefined}
            >
              <span className="dock-icon">
                <Icon size={16} strokeWidth={1.8} />
                {name === "chat" && chat.unread > 0 && <span className="dock-unread">{chat.unread > 9 ? "9+" : chat.unread}</span>}
              </span>
              <span className="dock-label">{name}</span>
            </button>
          );
        })}
      </nav>
      <ChatNoticeStack
        notices={chat.notices}
        onOpen={() => { openSite(CHAT_SCREEN); chat.markRead(); }}
        onDismiss={chat.dismissNotice}
      />

      {ownerPromptOpen && (
        <div className="cocox-owner-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOwnerPromptOpen(false);
        }}>
          <section className="cocox-owner-panel" role="dialog" aria-modal="true" aria-label="CocoX owner panel">
            <button className="cocox-owner-close" type="button" onClick={() => setOwnerPromptOpen(false)} aria-label="Close owner panel">×</button>
            {!ownerUnlocked ? (
              <form onSubmit={unlockOwner}>
                <span className="cocox-owner-kicker">COCOX PRIVATE ACCESS</span>
                <h2>Enter Owner Key</h2>
                <p>Owner access is required to manage site-wide video playback.</p>
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  value={ownerKeyInput}
                  onChange={(event) => setOwnerKeyInput(event.target.value)}
                  placeholder="Owner key"
                  aria-label="Owner key"
                />
                {ownerError && <div className="cocox-owner-error">{ownerError}</div>}
                <button className="cocox-owner-primary" type="submit">Unlock Owner Panel</button>
              </form>
            ) : (
              <div>
                <span className="cocox-owner-kicker">COCOX CONTROL CENTER</span>
                <h2>Owner</h2>
                <p className="cocox-owner-status"><i className={ownerChannelReady ? "online" : ""} />{ownerChannelReady ? "Live broadcast connected" : "Connecting to live broadcast…"}</p>
                <div className="cocox-owner-video-card">
                  <strong>Site-wide video</strong>
                  <span>Broadcast the bundled MP4 to everyone currently connected to CocoX.</span>
                  <div className="cocox-owner-actions">
                    <button className="cocox-owner-primary" type="button" disabled={!ownerChannelReady} onClick={() => void sendVideoCommand("play")}>Play for Everyone</button>
                    <button className="cocox-owner-secondary" type="button" disabled={!ownerChannelReady} onClick={() => void sendVideoCommand("stop")}>Stop Broadcast</button>
                  </div>
                </div>
                {ownerError && <div className="cocox-owner-error">{ownerError}</div>}
                <button className="cocox-owner-secondary cocox-owner-lock" type="button" onClick={() => { setOwnerUnlocked(false); setOwnerPromptOpen(false); }}>Lock Owner Panel</button>
              </div>
            )}
          </section>
        </div>
      )}

      {broadcastStartedAt !== null && (
        <div className="cocox-broadcast-overlay" role="dialog" aria-modal="true" aria-label="CocoX site announcement video">
          <video
            ref={broadcastVideoRef}
            src="/owner-broadcast.mp4"
            autoPlay
            playsInline
            preload="auto"
            onEnded={() => setBroadcastStartedAt(null)}
          />
          {audioNeedsGesture && (
            <button
              className="cocox-broadcast-audio-start"
              type="button"
              onClick={() => {
                const video = broadcastVideoRef.current;
                if (!video) return;
                video.muted = false;
                video.volume = 1;
                void video.play().then(() => setAudioNeedsGesture(false)).catch(() => setAudioNeedsGesture(true));
              }}
            >Tap once to start video with sound</button>
          )}
          <div className="cocox-broadcast-controls">
            <span>COCOX SITE BROADCAST</span>
            <span>Video ends automatically</span>
          </div>
        </div>
      )}
      </main>
    </>
  );
}