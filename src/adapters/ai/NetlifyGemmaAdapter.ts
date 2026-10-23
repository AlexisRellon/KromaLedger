import { buildGemmaBudgetPrompt } from "../../core/engine/aiPrompts";
import { type AIAdvisorRequest, type AIAdvisorResponse, type RateLimitStatus } from "../../core/models/ai";
import { type IAIEngine } from "../../core/ports/IAIEngine";

export class NetlifyGemmaAdapter implements IAIEngine {
  private endpoint: string;

  constructor(endpoint: string = "/.netlify/functions/gemma") {
    this.endpoint = endpoint;
  }

  async askWeeklyBudget(request: AIAdvisorRequest): Promise<AIAdvisorResponse> {
    const { systemInstruction, contents } = buildGemmaBudgetPrompt(
      request.userPrompt,
      request.context,
      request.history
    );

    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemInstruction, contents, history: request.history }),
      });
    } catch (err: any) {
      throw new Error(`Failed to connect to AI assistant endpoint: ${err?.message || "Network offline"}`);
    }

    if (res.status === 429) {
      const errorData = await res.json().catch(() => ({}));
      const waitMins = Math.ceil((errorData.resetsInSeconds || 3600) / 60);
      throw new Error(
        `1-hour usage limit reached. Please wait ~${waitMins} minute${waitMins === 1 ? "" : "s"} before asking again.`
      );
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `AI service returned error HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      answerMarkdown: data.answerMarkdown || "No response received from assistant.",
      modelUsed: data.modelUsed || "gemini-3.5-flash-lite",
    };
  }

  async getRateLimitStatus(): Promise<RateLimitStatus> {
    try {
      const res = await fetch(this.endpoint, { method: "GET" });
      if (!res.ok) {
        return { isLimited: false, resetsInSeconds: 0, remainingCalls: 30, totalLimit: 30 };
      }
      const data = await res.json();
      return {
        isLimited: Boolean(data.isLimited),
        resetsInSeconds: data.resetsInSeconds || 0,
        remainingCalls: data.remainingCalls ?? 30,
        totalLimit: data.totalLimit ?? 30,
      };
    } catch {
      return { isLimited: false, resetsInSeconds: 0, remainingCalls: 30, totalLimit: 30 };
    }
  }
}
