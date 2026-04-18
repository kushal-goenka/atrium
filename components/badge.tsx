import { cn } from "@/lib/utils";

type Variant = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";

const styles: Record<Variant, string> = {
  neutral:
    "bg-[color:var(--color-bg-sunken)] text-[color:var(--color-fg-muted)] border-[color:var(--color-border)]",
  accent:
    "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)] border-[color:var(--color-accent)]/25",
  ok: "bg-[color:var(--color-ok)]/10 text-[color:var(--color-ok)] border-[color:var(--color-ok)]/25",
  warn: "bg-[color:var(--color-warn)]/10 text-[color:var(--color-warn)] border-[color:var(--color-warn)]/30",
  danger:
    "bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] border-[color:var(--color-danger)]/30",
  info: "bg-[color:var(--color-info)]/10 text-[color:var(--color-info)] border-[color:var(--color-info)]/25",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full border px-2 text-[11px] font-medium leading-none tracking-wide",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
