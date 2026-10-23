import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownRenderer } from "../../src/ui/components/MarkdownRenderer";

describe("MarkdownRenderer", () => {
  it("renders headers and bullet lists cleanly", () => {
    const md = `### Week Overview
* Safe daily limit: PHP 1,500.00
* Avoid dining out`;

    const html = renderToStaticMarkup(createElement(MarkdownRenderer, { content: md }));
    expect(html).toContain("Week Overview");
    expect(html).toContain("Safe daily limit:");
    expect(html).toContain("PHP 1,500.00");
  });

  it("renders code blocks and inline code", () => {
    const md = `Use the command \`npm run dev\` to start.
\`\`\`bash
npm test
\`\`\``;

    const html = renderToStaticMarkup(createElement(MarkdownRenderer, { content: md }));
    expect(html).toContain("npm run dev");
    expect(html).toContain("npm test");
  });
});
