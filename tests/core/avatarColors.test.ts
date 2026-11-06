import { describe, expect, it } from "vitest";
import { getAvatarColors } from "../../src/ui/primitives/avatarColors";

describe("avatar colors", () => {
  it("keeps initials above 4.5:1 across bright, dark and middle-luminance colors", () => {
    const colors = ["#D9F938", "#4A154B", "#10B981", "#F43F5E", "#0284C7", "#fff", "#000"];
    for (let channel = 0; channel < 256; channel++) {
      colors.push(`#${channel.toString(16).padStart(2, "0").repeat(3)}`);
    }
    for (const color of colors) {
      const result = getAvatarColors(color);
      const linear = (offset: number) => {
        const channel = parseInt(result.backgroundColor.slice(offset, offset + 2), 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      };
      const luminance = linear(1) * 0.2126 + linear(3) * 0.7152 + linear(5) * 0.0722;
      const contrast = result.color === "#FFFFFF" ? 1.05 / (luminance + 0.05) : (luminance + 0.05) / 0.05;
      expect(contrast, color).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("uses the brand background for invalid legacy values", () => {
    expect(getAvatarColors("invalid")).toEqual(getAvatarColors());
    expect(getAvatarColors("#fff")).toEqual({ backgroundColor: "#ffffff", color: "#000000" });
  });
});
