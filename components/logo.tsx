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
        <path
          d="M10 54V28a22 22 0 0 1 44 0v26"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="22" cy="46" r="3" fill="currentColor" />
        <circle cx="32" cy="46" r="3" fill="currentColor" />
        <circle cx="42" cy="46" r="3" fill="currentColor" />
      </svg>
      {showWordmark ? (
        <span className="text-[1.05rem] font-semibold tracking-tight">atrium</span>
      ) : null}
    </span>
  );
}
