import { createFileRoute } from "@tanstack/react-router";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Read idk.env here as well as in the server entry. This makes the key loader
// resilient to hosts that start the generated Nitro server from a different cwd.
function getOpenRouterApiKey(): string {
  const fromEnvironment = process.env["OPENROUTER_API_KEY"]?.trim();
  if (fromEnvironment) return fromEnvironment;

  const candidates = [
    resolve(process.cwd(), "idk.env"),
    resolve(process.cwd(), "project-build-assistant-main", "idk.env"),
    resolve(process.cwd(), "..", "idk.env"),
  ];

  for (const filePath of candidates) {
    try {
      if (!existsSync(filePath)) continue;
      const contents = readFileSync(filePath, "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const equalsAt = trimmed.indexOf("=");
        if (equalsAt < 1) continue;
        const name = trimmed.slice(0, equalsAt).trim();
        let value = trimmed.slice(equalsAt + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (name === "OPENROUTER_API_KEY" && value &&
            value !== "PASTE_YOUR_OPENROUTER_KEY_HERE" &&
            value !== "your_key") {
          return value;
        }
      }
    } catch {
      // Try the next candidate path; never expose file contents in an error.
    }
  }
  return "";
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = getOpenRouterApiKey();
        if (!apiKey) {
          return Response.json(
            { error: "OpenRouter key not found. Add the OPENROUTER_API_KEY secret in Project Settings → Secrets, then try again." },
            { status: 503 },
          );
        }

        let body: { model?: unknown; messages?: unknown };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON request." }, { status: 400 });
        }

        const model = typeof body.model === "string" ? body.model.trim() : "openai/gpt-4o-mini";
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (!model || model.length > 200 || messages.length === 0 || messages.length > 60) {
          return Response.json({ error: "Choose a valid model and send between 1 and 60 messages." }, { status: 400 });
        }

        const safeMessages: ChatMessage[] = [];
        for (const item of messages) {
          if (!item || typeof item !== "object") continue;
          const message = item as Record<string, unknown>;
          if ((message["role"] !== "user" && message["role"] !== "assistant") || typeof message["content"] !== "string") continue;
          safeMessages.push({ role: message["role"], content: message["content"].slice(0, 12000) });
        }
        if (!safeMessages.length) return Response.json({ error: "No valid chat messages were provided." }, { status: 400 });

        try {
          const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": new URL(request.url).origin,
              "X-OpenRouter-Title": "CocoX.wtf",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: "You are CocoX AI, a friendly and helpful assistant. Be clear, useful, and concise." },
                ...safeMessages,
              ],
              temperature: 0.7,
              max_tokens: 1200,
            }),
          });
          const data = await upstream.json().catch(() => ({}));
          if (!upstream.ok) {
            const message = (data as { error?: { message?: string } })?.error?.message;
            return Response.json({ error: message || `OpenRouter returned HTTP ${upstream.status}.` }, { status: upstream.status });
          }
          const answer = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
          if (typeof answer !== "string" || !answer.trim()) {
            return Response.json({ error: "The selected model returned an empty response." }, { status: 502 });
          }
          return Response.json({ answer: answer.trim() });
        } catch {
          return Response.json({ error: "Could not reach OpenRouter. Check the server connection and try again." }, { status: 502 });
        }
      },
    },
  },
});
