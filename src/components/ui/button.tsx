import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-[background-color,color,border-color,transform] duration-[--dur-micro] ease-[--ease-out] disabled:cursor-not-allowed disabled:opacity-55 whitespace-nowrap";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white border border-accent hover:bg-accent-hover hover:border-accent-hover active:translate-y-px",
  secondary:
    "bg-surface text-ink border border-rule hover:border-rule-strong hover:bg-surface-2 active:translate-y-px",
  ghost:
    "bg-transparent text-ink-2 border border-transparent hover:bg-surface-2 hover:text-ink",
  danger:
    "bg-surface text-danger border border-danger/30 hover:bg-danger-soft active:translate-y-px",
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
};

export default function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
