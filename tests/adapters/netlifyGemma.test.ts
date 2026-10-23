import { beforeEach, describe, expect, it } from "vitest";
import handler from "../../netlify/functions/gemma.ts";

declare const process: any;

describe("Netlify Gemma Function Handler", () => {
  beforeEach(() => {
    delete process.env.GOOGLE_AI_API_KEY_1;
    delete process.env.GOOGLE_AI_API_KEY_2;
    delete process.env.GOOGLE_AI_API_KEY_3;
    delete process.env.GOOGLE_AI_API_KEY_4;
    delete process.env.GOOGLE_AI_API_KEYS;
    delete process.env.GOOGLE_AI_API_KEY;
  });

  it("handles GET request to return current rate limit status", async () => {
    const req = new Request("http://localhost/.netlify/functions/gemma", {
      method: "GET",
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    const res = await handler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isLimited).toBe(false);
    expect(typeof data.remainingCalls).toBe("number");
    expect(data.activeKeysCount).toBe(0);
  });

  it("returns 503 when no Google AI keys are provided in env", async () => {
    const req = new Request("http://localhost/.netlify/functions/gemma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt: "How can I budget this week?" }),
    });

    const res = await handler(req);
    expect(res.status).toBe(503);

    const data = await res.json();
    expect(data.error).toBe("NO_API_KEYS_CONFIGURED");
  });
});
