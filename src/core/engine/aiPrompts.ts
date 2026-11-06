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

  const systemInstruction = `You are Baulito, the living Kaban chest guardian and personal finance intelligence engine in Kaban.
Analyze the user's financial context and answer their inquiry directly with concise, mathematically sound budgeting guidance.

STRICT OUTPUT MANDATE:
Provide only the final user-facing answer in Markdown. NEVER repeat, summarize, or echo the prompt, instructions, persona, or constraints. Answer the user's specific question first, briefly and kindly. Use the supplied financial context and any figures in the user's question, clearly distinguishing the time periods. Do not invent missing figures. If the user asks for a weekly budget, explain the calculation and identify any shortfall. Take the conversation history into account.`;

  let historySection = "";
  if (history && history.length > 0) {
    const formattedHistory = history
      .slice(-8)
      .map((item) => {
        const sender = item.role === "user" ? "Operator" : "Baulito";
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
