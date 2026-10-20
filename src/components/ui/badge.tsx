export type BadgeTone = "neutral" | "accent" | "success" | "warn" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "border-rule bg-surface-2 text-ink-2",
  accent: "border-accent/25 bg-accent-soft text-accent-ink",
  success: "border-success/25 bg-success-soft text-success",
  warn: "border-warn/25 bg-warn-soft text-warn",
  danger: "border-danger/25 bg-danger-soft text-danger",
  info: "border-info/25 bg-info-soft text-info",
};

export default function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
