import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react";

export type PresentationBoxProps = PropsWithChildren<{
  surface?: "card" | "plain" | "muted";
  direction?: "row" | "column";
  align?: "start" | "center" | "end" | "between";
  gap?: "none" | "sm" | "md" | "lg";
  padding?: "none" | "sm" | "md" | "lg";
}>;
export type PresentationTextProps = PropsWithChildren<{
  as?: "heading" | "body" | "caption";
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "primary" | "muted" | "accent" | "inverse" | "inherit";
  weight?: "normal" | "medium" | "bold";
  mono?: boolean;
}>;
export type PresentationButtonProps = PropsWithChildren<{
  variant?: "primary" | "secondary";
  disabled?: boolean;
  accessibilityLabel: string;
  onPress(): void;
}>;
export type PresentationIconProps = { name: "credit-card" | "plus"; label?: string };
export type PresentationInputProps = {
  value: string;
  accessibilityLabel: string;
  type?: "text" | "number";
  onValueChange(value: string): void;
};
export type PresentationModalProps = PropsWithChildren<{
  accessibilityLabel: string;
  onDismiss(): void;
}>;

export interface PresentationComponents {
  Box(props: PresentationBoxProps): ReactNode;
  Text(props: PresentationTextProps): ReactNode;
  Button(props: PresentationButtonProps): ReactNode;
  Icon(props: PresentationIconProps): ReactNode;
  Input(props: PresentationInputProps): ReactNode;
  Modal(props: PresentationModalProps): ReactNode;
}

const PresentationContext = createContext<PresentationComponents | null>(null);

export function PresentationProvider({ components, children }: PropsWithChildren<{ components: PresentationComponents }>) {
  return <PresentationContext.Provider value={components}>{children}</PresentationContext.Provider>;
}

export function usePresentationComponents(): PresentationComponents {
  const components = useContext(PresentationContext);
  if (!components) throw new Error("Presentation components are not available in this platform.");
  return components;
}
