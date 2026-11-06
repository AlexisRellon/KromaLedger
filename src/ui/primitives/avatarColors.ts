export function getAvatarColors(color = "#4A154B") {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color);
  const value = match?.[1] ?? "4A154B";
  const hex = value.length === 3 ? [...value].map((digit) => digit + digit).join("") : value;
  const linearChannel = (offset: number) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const luminance = linearChannel(0) * 0.2126 + linearChannel(2) * 0.7152 + linearChannel(4) * 0.0722;
  return { backgroundColor: `#${hex}`, color: luminance > 0.179 ? "#000000" : "#FFFFFF" };
}
