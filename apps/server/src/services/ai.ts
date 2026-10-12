import { env } from "../env.js";

export interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export const aiEnabled = env.aiEnabled;

interface CallOpts {
  json?: boolean;
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
}

function endpoint(): string {
  return `${env.AI_BASE_URL.replace(/\/$/, "")}/chat/completions`;
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.AI_API_KEY}`,
  };
}

/** Non-streaming completion. Returns the assistant text. */
export async function chatComplete(messages: ChatMsg[], opts: CallOpts = {}): Promise<string> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: headers(),
    signal: opts.signal,
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens ?? 900,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Streaming completion. Calls `onText(delta, full)` as tokens arrive.
 * Returns the full text. Aborts cleanly when `signal` fires.
 */
export async function streamChat(
  messages: ChatMsg[],
  onText: (delta: string, full: string) => void,
  opts: CallOpts = {},
): Promise<string> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: headers(),
    signal: opts.signal,
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages,
      temperature: opts.temperature ?? 0.6,
      max_tokens: opts.maxTokens ?? 900,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line || !line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") return full;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const delta = parsed.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            onText(delta, full);
          }
        } catch {
          // ignore malformed keep-alive chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return full;
}
