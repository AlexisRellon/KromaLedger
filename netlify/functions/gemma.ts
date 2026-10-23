// Netlify Serverless Function: Google Gemma Assistant with Round-Robin Key Rotation & 1-Hour Rate Limiter
declare const process: {
  env: Record<string, string | undefined>;
};

interface RateLimitRecord {
  timestamps: number[];
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = Number(process.env.AI_HOURLY_RATE_LIMIT || 30);
const ipRateLimitStore = new Map<string, RateLimitRecord>();

let globalKeyIndex = 0;

function getApiKeys(): string[] {
  const keys: string[] = [];

  // Check designated numbered keys 1..4
  for (let i = 1; i <= 4; i++) {
    const k = process.env[`GOOGLE_AI_API_KEY_${i}`];
    if (k && k.trim()) keys.push(k.trim());
  }

  // Fallback to comma-separated list or single key
  if (keys.length === 0) {
    const commaList = process.env.GOOGLE_AI_API_KEYS;
    if (commaList) {
      keys.push(...commaList.split(",").map((s: string) => s.trim()).filter(Boolean));
    }
  }

  if (keys.length === 0 && process.env.GOOGLE_AI_API_KEY) {
    keys.push(process.env.GOOGLE_AI_API_KEY.trim());
  }

  return keys;
}

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; resetsInSeconds: number } {
  const now = Date.now();
  let record = ipRateLimitStore.get(clientIp);

  if (!record) {
    record = { timestamps: [] };
    ipRateLimitStore.set(clientIp, record);
  }

  // Prune timestamps older than 1 hour
  record.timestamps = record.timestamps.filter((t) => now - t < ONE_HOUR_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_HOUR) {
    const oldest = record.timestamps[0] ?? now;
    const resetsInSeconds = Math.max(1, Math.ceil((oldest + ONE_HOUR_MS - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetsInSeconds,
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_HOUR - record.timestamps.length,
    resetsInSeconds: 0,
  };
}

function recordUsage(clientIp: string): void {
  const now = Date.now();
  const record = ipRateLimitStore.get(clientIp) || { timestamps: [] };
  record.timestamps.push(now);
  ipRateLimitStore.set(clientIp, record);
}

export default async function handler(req: Request) {
  // CORS & Security headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-client";

  // Handle status probe
  if (req.method === "GET") {
    const status = checkRateLimit(clientIp);
    const keysCount = getApiKeys().length;
    return new Response(
      JSON.stringify({
        isLimited: !status.allowed,
        remainingCalls: status.remaining,
        resetsInSeconds: status.resetsInSeconds,
        totalLimit: MAX_REQUESTS_PER_HOUR,
        activeKeysCount: keysCount,
      }),
      { status: 200, headers }
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), { status: 405, headers });
  }

  // 1-Hour Rate Limit Check
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: "HOURLY_RATE_LIMIT_EXCEEDED",
        message: `1-hour allotted usage reached (${MAX_REQUESTS_PER_HOUR} calls/hr). Please wait ${rateLimit.resetsInSeconds}s.`,
        resetsInSeconds: rateLimit.resetsInSeconds,
        remainingCalls: 0,
      }),
      { status: 429, headers }
    );
  }

  const keys = getApiKeys();
  if (keys.length === 0) {
    return new Response(
      JSON.stringify({
        error: "NO_API_KEYS_CONFIGURED",
        message: "No Google AI API keys configured. Set GOOGLE_AI_API_KEY_1..4 in environment variables.",
      }),
      { status: 503, headers }
    );
  }

  let body: { userPrompt?: string; systemInstruction?: string; contents?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "INVALID_JSON_BODY" }), { status: 400, headers });
  }

  if (!body.contents && !body.userPrompt) {
    return new Response(JSON.stringify({ error: "MISSING_CONTENTS" }), { status: 400, headers });
  }

  // Round-robin key rotation with automatic failover
  let lastError = "";
  const totalKeys = keys.length;
  const targetModel = process.env.GEMMA_MODEL || "gemini-3.5-flash-lite";

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const key = keys[globalKeyIndex % totalKeys];
    globalKeyIndex = (globalKeyIndex + 1) % totalKeys;

    try {
      const gemmaUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`;
      
      const isGemini = targetModel.toLowerCase().startsWith("gemini");
      const payload: Record<string, any> = {
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1400,
        },
      };

      if (isGemini && body.systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: body.systemInstruction }],
        };
        payload.contents = [
          {
            role: "user",
            parts: [{ text: `${body.contents || body.userPrompt || ""}\n\nRespond directly as Kroma Prism starting with: ### Week Overview & Commitments` }],
          },
        ];
      } else {
        const fullPrompt = body.systemInstruction
          ? `${body.systemInstruction}\n\n${body.contents || body.userPrompt || ""}\n\nRespond directly as Kroma Prism starting with: ### Week Overview & Commitments`
          : body.contents || body.userPrompt || "";
        payload.contents = [
          {
            role: "user",
            parts: [{ text: fullPrompt }],
          },
        ];
      }

      const response = await fetch(gemmaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 429 || response.status === 403) {
        lastError = `Key ${globalKeyIndex} exhausted quota (HTTP ${response.status}). Rotating to next key.`;
        continue; // Failover to next key in pool
      }

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `Google API error (HTTP ${response.status}): ${errorText}`;
        continue;
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const generatedText = parts
        .map((p: any) => p?.text || "")
        .filter(Boolean)
        .join("\n");

      if (!generatedText) {
        const finishReason = data?.candidates?.[0]?.finishReason || "NO_CANDIDATES";
        const blockReason = data?.promptFeedback?.blockReason || "";
        lastError = `Google API returned empty candidate output (finishReason: ${finishReason}${blockReason ? `, blockReason: ${blockReason}` : ""})`;
        continue;
      }

      // Strip any internal chain-of-thought, thought tags, or prompt reflection/scratchpad
      let sanitizedText = generatedText
        .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();

      // If the model echoed prompt preambles (Persona, Constraints, Objectives, Drafting notes),
      // cleanly slice to the first actual section heading.
      const sectionMatch = sanitizedText.search(/(?:###?\s*|\*\*|#\s*)Week Overview/i);
      if (sectionMatch !== -1) {
        sanitizedText = sanitizedText.slice(sectionMatch).trim();
      } else {
        sanitizedText = sanitizedText
          .replace(/^\s*\*(?:Persona|Objective|Constraint|Drafting|Current Status|Input)[\s\S]*?\*Drafting the response\.\.\.\*\s*/i, "")
          .trim();
      }

      // Successful call: record against the 1-hour rate limit
      recordUsage(clientIp);

      return new Response(
        JSON.stringify({
          answerMarkdown: sanitizedText,
          modelUsed: targetModel,
          remainingCalls: rateLimit.remaining - 1,
        }),
        { status: 200, headers }
      );
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  // If all keys in round-robin pool failed
  return new Response(
    JSON.stringify({
      error: "ALL_KEYS_EXHAUSTED_OR_FAILED",
      message: `All ${totalKeys} API keys failed or exceeded upstream quota. Last error: ${lastError}`,
    }),
    { status: 502, headers }
  );
}
