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
          d="M32 10 L13 54"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M32 10 L51 54"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M20 40 L44 40"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
      </svg>
      {showWordmark ? (
        <span className="text-[1.05rem] font-semibold tracking-tight">atrium</span>
      ) : null}
    </span>
  );
}
