import { z } from "zod";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Expected a real ISO calendar date");

export const weeklyBudgetSnapshotSchema = z.object({
  today: dateOnlySchema,
  weekStartDate: dateOnlySchema,
  weekEndDate: dateOnlySchema,
  daysRemainingInWeek: z.number().int().nonnegative(),
  currency: z.string().length(3).default("PHP"),
  totalLiquidCashMinor: z.number().int(),
  dueThisWeek: z.object({
    subscriptionsMinor: z.number().int().nonnegative(),
    unpaidPayableInvoicesMinor: z.number().int().nonnegative(),
    expectedReceivablesMinor: z.number().int().nonnegative(),
    netObligationsMinor: z.number().int(),
  }),
  discretionaryBurnHistory: z.object({
    avgDailyExpenseMinor: z.number().int().nonnegative(),
    topCategoriesPastMonth: z.array(
      z.object({
        categoryName: z.string(),
        amountMinor: z.number().int().nonnegative(),
        percent: z.number().min(0).max(100),
      })
    ),
  }),
});

export type WeeklyBudgetSnapshot = z.infer<typeof weeklyBudgetSnapshotSchema>;

export const aiChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
  modelUsed: z.string().optional(),
});

export type AIChatMessage = z.infer<typeof aiChatMessageSchema>;

export const aiChatThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  messages: z.array(aiChatMessageSchema),
});

export type AIChatThread = z.infer<typeof aiChatThreadSchema>;

export const aiAdvisorRequestSchema = z.object({
  userPrompt: z.string().min(1).max(1000),
  context: weeklyBudgetSnapshotSchema,
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export type AIAdvisorRequest = z.infer<typeof aiAdvisorRequestSchema>;

export const aiAdvisorResponseSchema = z.object({
  answerMarkdown: z.string(),
  keyTakeaways: z.array(z.string()).optional(),
  modelUsed: z.string().optional(),
});

export type AIAdvisorResponse = z.infer<typeof aiAdvisorResponseSchema>;

export interface RateLimitStatus {
  isLimited: boolean;
  resetsInSeconds: number;
  remainingCalls: number;
  totalLimit: number;
}
