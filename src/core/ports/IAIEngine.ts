import { type AIAdvisorRequest, type AIAdvisorResponse, type RateLimitStatus } from "../models";

export interface IAIEngine {
  askWeeklyBudget(request: AIAdvisorRequest): Promise<AIAdvisorResponse>;
  getRateLimitStatus(): Promise<RateLimitStatus>;
}
