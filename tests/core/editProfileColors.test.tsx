import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { userProfileSchema } from "../../src/core/models";
import { EditProfileModal } from "../../src/ui/components/EditProfileModal";

vi.mock("../../src/ui/primitives", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../src/ui/primitives")>(),
  ModalShell: ({ children }: { children: React.ReactNode }) => children,
}));

describe("profile avatar background", () => {
  it("renders the saved custom color and an accessible color picker", () => {
    const profile = userProfileSchema.parse({ name: "Alex", initials: "A", themeColor: "#123456" });
    const html = renderToStaticMarkup(createElement(EditProfileModal, { profile, onClose: () => {}, onSave: async () => {} }));
    expect(html).toContain("Background Color");
    expect(html).toContain('aria-label="Custom avatar background color"');
    expect(html).toContain('value="#123456"');
    expect(html).toContain("background-color:#123456");
    expect(html).not.toContain("Theme Color");
  });
});
