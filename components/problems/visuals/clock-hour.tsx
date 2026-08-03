import { cn } from "@/lib/utils";

/** Analog clock with hour hand only (on-the-hour). */
export function ClockHour({
  hour,
  className,
}: {
  hour: number;
  className?: string;
}) {
  const h = ((Math.round(hour) % 12) + 12) % 12;
  const angle = h * 30; // 0 at 12
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("size-16 text-black", className)}
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="white"
        stroke="currentColor"
        strokeWidth="3"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 * Math.PI) / 180;
        const x = 50 + Math.sin(a) * 36;
        const y = 50 - Math.cos(a) * 36;
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fontWeight="600"
            fill="currentColor"
          >
            {i + 1}
          </text>
        );
      })}
      <line
        x1="50"
        y1="50"
        x2={50 + Math.sin((angle * Math.PI) / 180) * 22}
        y2={50 - Math.cos((angle * Math.PI) / 180) * 22}
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
    </svg>
  );
}
