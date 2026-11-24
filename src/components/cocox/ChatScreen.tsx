import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Ban, Crown, Flag, MessageCircle, Plus, Send, ShieldCheck, UserRound, X } from "lucide-react";

export type CocoXMessage = {
  id: number;
  sender_id: string;
  display_name: string;
  content: string;
  created_at: string;
};

export type CocoXNotice = {
  id: number;
  displayName: string;
  content: string;
};

const NAME_KEY = "cocox-chat-display-name";
const BLOCK_KEY = "cocox-chat-blocked-users";

export function useCocoXChat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState("");
  const [messages, setMessages] = useState<CocoXMessage[]>([]);
  const [notices, setNotices] = useState<CocoXNotice[]>([]);
  const [unread, setUnread] = useState(0);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [connection, setConnection] = useState<"loading" | "ready" | "error" | "missing">("loading");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    setDisplayNameState(window.localStorage.getItem(NAME_KEY) ?? "");
    try {
      setBlockedIds(JSON.parse(window.localStorage.getItem(BLOCK_KEY) ?? "[]") as string[]);
    } catch {
      setBlockedIds([]);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setConnection("missing");
      setError("Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.");
      return;
    }

    let alive = true;
    let channel: RealtimeChannel | undefined;

    async function connect() {
      try {
        let { data } = await supabase!.auth.getSession();
        if (!data.session) {
          const result = await supabase!.auth.signInAnonymously();
          if (result.error) throw result.error;
          data = { session: result.data.session };
        }
        if (!alive) return;
        const id = data.session?.user.id;
        if (!id) throw new Error("Couldn't create a chat session.");
        setUserId(id);

        // Load the complete shared chat history in pages. Supabase commonly
        // caps a single response, so one unbounded select can silently omit
        // older messages. The database remains the source of truth across
        // browser refreshes and server restarts.
        const pageSize = 1000;
        const allMessages: CocoXMessage[] = [];
        for (let offset = 0; ; offset += pageSize) {
          const result = await supabase!
            .from("messages")
            .select("id,sender_id,display_name,content,created_at")
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + pageSize - 1);
          if (result.error) throw result.error;
          const page = (result.data ?? []) as CocoXMessage[];
          allMessages.push(...page);
          if (page.length < pageSize) break;
        }
        if (!alive) return;
        setMessages(allMessages);
        setConnection("ready");

        channel = supabase!.channel("cocox-public-chat")
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            const typingId = String(payload?.sender_id ?? "");
            const typingName = String(payload?.display_name ?? "").slice(0, 24);
            if (!typingId || typingId === id || !typingName) return;
            setTypingUsers((current) => payload?.is_typing
              ? [...new Set([...current.filter((name) => name !== typingName), typingName])]
              : current.filter((name) => name !== typingName));
            if (payload?.is_typing) {
              window.setTimeout(() => setTypingUsers((current) => current.filter((name) => name !== typingName)), 3500);
            }
          })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
            const message = payload.new as CocoXMessage;
            setMessages((current) => current.some((item) => item.id === message.id)
              ? current
              : [...current, message].sort((a, b) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id - b.id
                ));
            if (message.sender_id !== id) {
              setNotices((current) => [{ id: message.id, displayName: message.display_name, content: message.content }, ...current].slice(0, 3));
              setUnread((current) => current + 1);
            }
          })
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setConnection("error");
              setError("Live updates disconnected. Refresh CocoX to reconnect.");
            }
          });
        channelRef.current = channel;
      } catch (cause) {
        if (!alive) return;
        setConnection("error");
        setError(cause instanceof Error ? cause.message : "Couldn't connect to CocoX chat.");
      }
    }

    void connect();
    return () => {
      alive = false;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      channelRef.current = null;
      if (channel) void supabase!.removeChannel(channel);
    };
  }, []);

  function setDisplayName(name: string) {
    const clean = name.trim().replace(/[<>\n\r]/g, "").slice(0, 24);
    setDisplayNameState(clean);
    window.localStorage.setItem(NAME_KEY, clean);
  }

  function setTyping(isTyping: boolean) {
    if (!userId || !displayName || !channelRef.current) return;
    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { sender_id: userId, display_name: displayName, is_typing: isTyping },
    });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTyping) {
      typingTimer.current = setTimeout(() => setTyping(false), 1800);
    }
  }

  async function sendMessage(content: string) {
    const clean = content.trim();
    if (!supabase || !userId || !displayName || !clean || clean.length > 500) return;
    if (/(https?:\/\/|www\.)/i.test(clean) || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(clean) || /(?:\+?\d[\d .()\-]{7,}\d)/.test(clean)) {
      setError("For safety, CocoX chat doesn't allow links, email addresses, or phone numbers.");
      return;
    }
    const now = Date.now();
    if (now - lastSentAt.current < 1200) {
      setError("Please wait a moment before sending another message.");
      return;
    }
    lastSentAt.current = now;
    setSending(true);
    setError("");
    const { error: sendError } = await supabase.from("messages").insert({
      sender_id: userId,
      display_name: displayName,
      content: clean,
    });
    setSending(false);
    if (sendError) setError(sendError.message);
  }

  function markRead() {
    setUnread(0);
    setNotices([]);
  }

  function dismissNotice(id: number) {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }

  function blockUser(id: string) {
    const next = [...new Set([...blockedIds, id])];
    setBlockedIds(next);
    window.localStorage.setItem(BLOCK_KEY, JSON.stringify(next));
    setNotices((current) => current.filter((notice) => !messages.some((message) => message.id === notice.id && message.sender_id === id)));
  }

  async function reportMessage(messageId: number, reason: string) {
    if (!supabase || !userId) return "Chat isn't connected.";
    const { error: reportError } = await supabase.from("message_reports").insert({
      message_id: messageId,
      reporter_id: userId,
      reason,
    });
    return reportError?.message ?? "Thanks. Your report was submitted for review.";
  }

  return {
    userId, displayName, setDisplayName, messages, notices, unread, blockedIds, typingUsers,
    connection, error, setError, sending, sendMessage, setTyping, markRead, dismissNotice,
    blockUser, reportMessage,
  };
}

export function ChatScreen({
  chat,
  goHome,
}: {
  chat: ReturnType<typeof useCocoXChat>;
  goHome: () => void;
}) {
  const [nameDraft, setNameDraft] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportStatus, setReportStatus] = useState("");
  const [ownerLoginOpen, setOwnerLoginOpen] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerLoginError, setOwnerLoginError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOwnerShortcut(event: KeyboardEvent) {
      if (event.ctrlKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setOwnerLoginOpen(true);
        setOwnerPassword("");
        setOwnerLoginError("");
      }
    }
    window.addEventListener("keydown", handleOwnerShortcut);
    return () => window.removeEventListener("keydown", handleOwnerShortcut);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    chat.markRead();
  }, [chat.messages.length]);

  function saveName(event: FormEvent) {
    event.preventDefault();
    chat.setDisplayName(nameDraft);
  }

  function submitOwnerLogin(event: FormEvent) {
    event.preventDefault();
    if (ownerPassword === "12300") {
      chat.setDisplayName("CocoX [Owner]");
      setNameDraft("");
      setOwnerLoginOpen(false);
      setOwnerPassword("");
      setOwnerLoginError("");
    } else {
      setOwnerLoginError("Incorrect owner password.");
    }
  }

  async function submitMessage(event: FormEvent) {
    event.preventDefault();
    const value = messageDraft;
    if (!value.trim()) return;
    await chat.sendMessage(value);
    setMessageDraft("");
  }

  async function report(id: number) {
    const result = await chat.reportMessage(id, "Inappropriate or unsafe message");
    setReportStatus(result);
    setReportingId(null);
  }

  const visibleMessages = chat.messages.filter((message) => !chat.blockedIds.includes(message.sender_id));

  return (
    <section className="browser-window cocox-chat-window" aria-label="CocoX chat">
      <div className="tab-row chat-tab-row">
        <button className="new-tab" type="button" aria-label="Return to home" title="Return to home" onClick={goHome}><Plus size={17} /></button>
        <span className="chat-top-title"><MessageCircle size={14} /> CocoX Chat</span>
        <span className={`chat-connection ${chat.connection}`}>{chat.connection === "ready" ? "Live" : chat.connection === "loading" ? "Connecting" : "Offline"}</span>
      </div>
      {ownerLoginOpen && (
        <div className="chat-owner-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOwnerLoginOpen(false); }}>
          <form className="chat-owner-dialog" onSubmit={submitOwnerLogin} role="dialog" aria-modal="true" aria-labelledby="owner-login-title">
            <button className="chat-owner-close" type="button" onClick={() => setOwnerLoginOpen(false)} aria-label="Close owner login"><X size={17} /></button>
            <Crown size={30} className="chat-owner-crown" />
            <h2 id="owner-login-title">Owner Password</h2>
            <p>Enter the owner password to use the CocoX owner name.</p>
            <input autoFocus type="password" value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} placeholder="Owner Password" aria-label="Owner Password" />
            {ownerLoginError && <span className="chat-owner-error" role="alert">{ownerLoginError}</span>}
            <button className="chat-owner-submit" type="submit">Login</button>
          </form>
        </div>
      )}
      <div className="chat-layout">
        <div className="chat-heading">
          <div>
            <h2>Community chat</h2>
            <p>Talk in the shared CocoX room. Don't share personal information.</p>
          </div>
          <div className="chat-name-area">
            <UserRound size={15} />
            <input aria-label="Your display name" value={nameDraft || chat.displayName} onChange={(event) => setNameDraft(event.target.value)} maxLength={24} placeholder="Set your name" />
            <button type="button" onClick={saveName} disabled={!nameDraft.trim()}>Save</button>
          </div>
        </div>
        {chat.connection !== "ready" && (
          <div className={`chat-status ${chat.connection}`} role="status">
            {chat.connection === "loading" ? "Connecting to CocoX Chat…" : chat.error || "Chat is currently unavailable."}
          </div>
        )}
        {chat.error && chat.connection === "ready" && <div className="chat-status error" role="status">{chat.error}</div>}
        {reportStatus && <div className="chat-status" role="status">{reportStatus}<button type="button" onClick={() => setReportStatus("")} aria-label="Dismiss">×</button></div>}
        {!chat.displayName ? (
          <form className="chat-name-prompt" onSubmit={saveName}>
            <ShieldCheck size={28} />
            <h3>Choose a chat name</h3>
            <p>Use a nickname, not your real name or other personal details.</p>
            <input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} maxLength={24} placeholder="Your nickname" required />
            <button type="submit" disabled={!nameDraft.trim()}>Join chat</button>
          </form>
        ) : (
          <>
            <div className="chat-messages" aria-live="polite">
              {visibleMessages.length === 0 ? (
                <div className="chat-empty"><MessageCircle size={24} /><p>No messages yet. Start with a friendly hello!</p></div>
              ) : visibleMessages.map((message) => (
                <article className={`chat-message ${message.sender_id === chat.userId ? "mine" : ""}`} key={message.id}>
                  <div className="chat-message-meta"><strong className={message.display_name === "CocoX [Owner]" ? "chat-owner-name" : undefined}>{message.display_name === "CocoX [Owner]" && <Crown size={13} />} {message.display_name}</strong><time>{new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div>
                  <p>{message.content}</p>
                  {message.sender_id !== chat.userId && <div className="chat-message-actions">
                    <button type="button" onClick={() => chat.blockUser(message.sender_id)} title="Hide this person's messages"><Ban size={12} /> Block</button>
                    <button type="button" onClick={() => setReportingId(message.id)} title="Report this message"><Flag size={12} /> Report</button>
                    {reportingId === message.id && <button type="button" onClick={() => void report(message.id)}>Confirm report</button>}
                  </div>}
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
            {chat.typingUsers.length > 0 && (
              <div className="chat-typing-indicator" role="status" aria-live="polite">
                <span className="chat-typing-dots"><i /><i /><i /></span>
                <span>{chat.typingUsers.length === 1
                  ? `${chat.typingUsers[0]} is typing…`
                  : chat.typingUsers.length === 2
                    ? `${chat.typingUsers[0]} and ${chat.typingUsers[1]} are typing…`
                    : `${chat.typingUsers[0]} and ${chat.typingUsers.length - 1} others are typing…`}</span>
              </div>
            )}
            <form className="chat-composer" onSubmit={submitMessage}>
              <input value={messageDraft} onChange={(event) => { setMessageDraft(event.target.value); chat.setTyping(Boolean(event.target.value.trim())); }} onBlur={() => chat.setTyping(false)} maxLength={500} placeholder="Write a message…" aria-label="Write a message" disabled={chat.connection !== "ready"} />
              <span>{messageDraft.length}/500</span>
              <button type="submit" aria-label="Send message" disabled={!messageDraft.trim() || chat.sending || chat.connection !== "ready"}><Send size={16} /></button>
            </form>
          </>
        )}
        <div className="chat-safety-note"><ShieldCheck size={13} /> No private messages. Block or report anyone who makes you uncomfortable.</div>
      </div>
    </section>
  );
}

export function ChatNoticeStack({
  notices,
  onOpen,
  onDismiss,
}: {
  notices: CocoXNotice[];
  onOpen: () => void;
  onDismiss: (id: number) => void;
}) {
  if (!notices.length) return null;
  return (
    <aside className="chat-notice-stack" aria-label="New chat messages">
      {notices.map((notice) => (
        <div className="chat-notice" key={notice.id}>
          <button className="chat-notice-open" type="button" onClick={onOpen}>
            <span className="chat-notice-icon"><MessageCircle size={16} /></span>
            <span className="chat-notice-copy"><strong>Message · {notice.displayName}</strong><span>{notice.content}</span></span>
          </button>
          <button className="chat-notice-dismiss" type="button" onClick={() => onDismiss(notice.id)} aria-label="Dismiss notification"><X size={13} /></button>
        </div>
      ))}
    </aside>
  );
}
