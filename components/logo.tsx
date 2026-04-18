import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showWordmark?: boolean;
  size?: number;
};

export function Logo({ className, showWordmark = true, size = 28 }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[color:var(--color-fg)]", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-label="atrium"
        role="img"
      >
        <rect x="16" y="14" width="32" height="10" rx="5" fill="currentColor" fillOpacity="0.35" />
        <rect x="8" y="27" width="48" height="10" rx="5" fill="currentColor" />
        <rect x="22" y="40" width="20" height="10" rx="5" fill="currentColor" fillOpacity="0.6" />
      </svg>
      {showWordmark ? (
        <span className="text-[1.05rem] font-semibold tracking-tight">atrium</span>
      ) : null}
    </span>
  );
}
