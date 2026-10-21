import { cn } from "@/lib/utils";

export type Stat = {
  label: string;
  value: string;
  hint?: string;
  /** Color del valor (p. ej. "text-primary"). */
  className?: string;
  testId?: string;
};

/** Franja de vidrio con cifras separadas por divisores verticales. */
export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <dl className="-ml-px grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 border-l px-[22px] py-[18px]">
            <dt className="text-muted-foreground text-[13px]">{stat.label}</dt>
            <dd
              data-testid={stat.testId}
              className={cn("text-2xl font-medium tracking-[-0.02em] tabular-nums", stat.className)}
            >
              {stat.value}
            </dd>
            {stat.hint && <dd className="text-muted-foreground text-xs">{stat.hint}</dd>}
          </div>
        ))}
      </dl>
    </div>
  );
}
