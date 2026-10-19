"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDay, formatMonth } from "@/lib/dates";
import { formatCup, formatNumber } from "@/lib/money";
import type { Dashboard } from "../queries";

const compact = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });
const shortDay = (iso: string) => formatDay(iso).slice(0, 6);

/** Tooltip con el importe formateado en CUP y el indicador del color de la serie. */
function cupTooltip(config: ChartConfig, labelFormatter?: (label: string) => string) {
  return (
    <ChartTooltipContent
      labelFormatter={
        labelFormatter
          ? (_, payload) =>
              labelFormatter(
                String(payload?.[0]?.payload?.month ?? payload?.[0]?.payload?.day ?? ""),
              )
          : undefined
      }
      formatter={(value, name, item) => (
        <div className="flex w-full items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-[2px]"
            style={{ background: item.color ?? item.payload?.fill }}
          />
          <span className="text-muted-foreground">{config[String(name)]?.label ?? name}</span>
          <span className="text-foreground ml-auto font-mono font-medium tabular-nums">
            {formatCup(Number(value))}
          </span>
        </div>
      )}
    />
  );
}

export function EmptyChart({ children = "Sin datos en este periodo." }: { children?: string }) {
  return (
    <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
      {children}
    </div>
  );
}

// ─── Saldo en el tiempo ───

const balanceConfig = {
  balance: { label: "Saldo", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function BalanceChart({ data }: { data: Dashboard["balanceSeries"] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ChartContainer config={balanceConfig} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fill-balance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={shortDay}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          domain={[(min: number) => Math.min(0, min), "auto"]}
          tickFormatter={(v) => compact.format(v)}
        />
        <ChartTooltip cursor content={cupTooltip(balanceConfig, formatDay)} />
        <Area
          dataKey="balance"
          type="stepAfter"
          stroke="var(--color-balance)"
          strokeWidth={2}
          fill="url(#fill-balance)"
          dot={data.length < 20 ? { r: 4, strokeWidth: 2, fill: "var(--background)" } : false}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// ─── Gasto por categoría (donut + tabla) ───

export function CategoryDonut({
  data,
  total,
}: {
  data: Dashboard["categoryShare"];
  total: number;
}) {
  if (data.length === 0) return <EmptyChart />;
  const config = Object.fromEntries(
    data.map((s) => [s.key, { label: s.name, color: s.color }]),
  ) satisfies ChartConfig;

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
      <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-[220px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="key"
                formatter={(value, _name, item) => (
                  <div className="flex w-full items-center gap-2">
                    <span
                      className="size-2.5 rounded-[2px]"
                      style={{ background: item.payload?.color }}
                    />
                    <span className="text-muted-foreground">{item.payload?.name}</span>
                    <span className="text-foreground ml-auto font-mono font-medium tabular-nums">
                      {formatCup(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="total"
            nameKey="key"
            innerRadius="58%"
            strokeWidth={2}
            stroke="var(--background)"
          >
            {data.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {/* Tabla: identidad y valores legibles sin depender del color. */}
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: s.color }} />
            <span className="min-w-0 flex-1">{s.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatNumber((s.total / total) * 100, 1)} %
            </span>
            <span className="text-right font-medium whitespace-nowrap tabular-nums">
              {formatCup(s.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Gasto mensual apilado por categoría ───

export function MonthlyChart({
  data,
  slots,
}: {
  data: Dashboard["monthly"];
  slots: Dashboard["slots"];
}) {
  const hasData = data.some((row) => slots.some((s) => Number(row[s.key as keyof typeof row]) > 0));
  if (!hasData) return <EmptyChart>Aún no hay gastos en los últimos 6 meses.</EmptyChart>;
  const config = Object.fromEntries(
    slots.map((s) => [s.key, { label: s.name, color: s.color }]),
  ) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatMonth}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => compact.format(v)}
        />
        <ChartTooltip cursor={false} content={cupTooltip(config, formatMonth)} />
        <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
        {slots.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="spend"
            fill={`var(--color-${s.key})`}
            stroke="var(--background)"
            strokeWidth={2}
            radius={i === slots.length - 1 ? [4, 4, 0, 0] : 0}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

// ─── Evolución de la tasa ───

const rateConfig = { rate: { label: "Tasa", color: "var(--chart-1)" } } satisfies ChartConfig;

export function RateChart({ data }: { data: Dashboard["rateSeries"] }) {
  if (data.length === 0) return <EmptyChart>No hay ventas de USD en este periodo.</EmptyChart>;
  return (
    <ChartContainer config={rateConfig} className="aspect-auto h-[220px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={shortDay}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          domain={["dataMin - 10", "dataMax + 10"]}
          tickFormatter={(v) => formatNumber(v, 0)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => formatDay(String(payload?.[0]?.payload?.day ?? ""))}
              formatter={(value) => (
                <div className="flex w-full items-center gap-2">
                  <span className="text-muted-foreground">CUP por USD</span>
                  <span className="text-foreground ml-auto font-mono font-medium tabular-nums">
                    {formatNumber(Number(value), 2)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Line
          dataKey="rate"
          type="monotone"
          stroke="var(--color-rate)"
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

// ─── Barras horizontales (persona, productos) ───

const amountConfig = { total: { label: "Gasto", color: "var(--chart-1)" } } satisfies ChartConfig;

export function HorizontalBars({ data }: { data: { name: string; total: number }[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ChartContainer
      config={amountConfig}
      className="aspect-auto w-full"
      style={{ height: 48 + data.length * 40 }}
    >
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 96 }} barCategoryGap="30%">
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} />
        <ChartTooltip cursor={false} content={cupTooltip(amountConfig)} />
        <Bar
          dataKey="total"
          fill="var(--color-total)"
          radius={[0, 4, 4, 0]}
          label={{
            position: "right",
            className: "fill-foreground text-xs tabular-nums",
            formatter: (v: unknown) => formatCup(Number(v)),
          }}
        />
      </BarChart>
    </ChartContainer>
  );
}
