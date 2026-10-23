import { type WeeklyBudgetSnapshot } from "../models";

function formatMinorToMajor(minor: number, currency: string): string {
  const major = (minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${major}`;
}

export function buildGemmaBudgetPrompt(
  userQuery: string,
  snapshot: WeeklyBudgetSnapshot,
  history?: Array<{ role: "user" | "assistant"; content: string }>
): { systemInstruction: string; contents: string } {
  const liquidCashStr = formatMinorToMajor(snapshot.totalLiquidCashMinor, snapshot.currency);
  const subsStr = formatMinorToMajor(snapshot.dueThisWeek.subscriptionsMinor, snapshot.currency);
  const payablesStr = formatMinorToMajor(snapshot.dueThisWeek.unpaidPayableInvoicesMinor, snapshot.currency);
  const receivablesStr = formatMinorToMajor(snapshot.dueThisWeek.expectedReceivablesMinor, snapshot.currency);
  const netObligationsStr = formatMinorToMajor(snapshot.dueThisWeek.netObligationsMinor, snapshot.currency);
  const avgDailyStr = formatMinorToMajor(snapshot.discretionaryBurnHistory.avgDailyExpenseMinor, snapshot.currency);

  const topCatsStr = snapshot.discretionaryBurnHistory.topCategoriesPastMonth.length > 0
    ? snapshot.discretionaryBurnHistory.topCategoriesPastMonth
        .map((c) => `- ${c.categoryName}: ${formatMinorToMajor(c.amountMinor, snapshot.currency)} (${c.percent}%)`)
        .join("\n")
    : "- No recent expenses recorded";

  const systemInstruction = `You are Kroma Prism, the personal finance intelligence engine in KromaLedger.
Analyze the user's financial context and answer their inquiry directly with concise, mathematically sound budgeting guidance.

STRICT OUTPUT MANDATE:
1. Provide ONLY the final user-facing advice in Markdown.
2. NEVER repeat, summarize, or echo the prompt, instructions, persona, constraints, or input figures.
3. NEVER output thinking steps, reasoning notes, checklist evaluations, or drafting scratchpads.
4. Your response MUST begin immediately with the heading: "### Week Overview & Commitments".
5. When conversation history is provided, take prior dialogue context into account while staying grounded in the verified numbers.

STRUCTURE YOUR ADVICE INTO THESE 4 SECTIONS:
### Week Overview & Commitments
Highlight total liquid cash, obligations due this week, and net position.

### Safe Daily Discretionary Limit
Calculate safe daily spend for the remaining ${snapshot.daysRemainingInWeek} days: (Liquid Cash - Obligations) / ${snapshot.daysRemainingInWeek}. If obligations exceed cash, state PHP 0.00 and clearly identify the shortfall.

### Actionable Tactical Advice
Directly address the user's specific inquiry. Provide 2-3 concrete, high-impact tactical actions based on their top expense categories.

### Projected Sunday Cushion
State the projected reserve balance at week's end if they maintain this spending ceiling.`;

  let historySection = "";
  if (history && history.length > 0) {
    const formattedHistory = history
      .slice(-8)
      .map((item) => {
        const sender = item.role === "user" ? "Operator" : "Kroma Prism";
        return `${sender}: ${item.content.trim()}`;
      })
      .join("\n\n");
    historySection = `\n\n<conversation_history>\n${formattedHistory}\n</conversation_history>`;
  }

  const contents = `<financial_context>
Date: ${snapshot.today}
Week Period: ${snapshot.weekStartDate} to ${snapshot.weekEndDate} (${snapshot.daysRemainingInWeek} days remaining including today)
Currency: ${snapshot.currency}
Total Liquid Cash (Across Active Wallets): ${liquidCashStr}
Upcoming Commitments Due This Week:
- Subscriptions Due: ${subsStr}
- Unpaid Invoices (Payables) Due: ${payablesStr}
- Expected Receivables Due: ${receivablesStr}
- Net Obligations Due This Week: ${netObligationsStr}
Historical Baseline (Past 30 Days):
- Average Daily Outflow: ${avgDailyStr}
- Top Spending Categories:
${topCatsStr}
</financial_context>${historySection}

<user_inquiry>
${userQuery.trim()}
</user_inquiry>`;

  return { systemInstruction, contents };
}
