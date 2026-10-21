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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDay, formatMonth } from "@/lib/dates";
import { type Currency, formatMoney, formatNumber } from "@/lib/money";
import type { Dashboard, UsdDashboard } from "../queries";

const compact = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });
const shortDay = (iso: string) => formatDay(iso).slice(0, 6);

/** Tooltip con el importe formateado en su moneda y el indicador del color de la serie. */
function moneyTooltip(
  config: ChartConfig,
  currency: Currency,
  labelFormatter?: (label: string) => string,
) {
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
            {formatMoney(Number(value), currency)}
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
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
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
        <ChartTooltip cursor content={moneyTooltip(balanceConfig, "CUP", formatDay)} />
        <Area
          dataKey="balance"
          type="linear"
          stroke="var(--color-balance)"
          strokeWidth={2.25}
          strokeLinejoin="round"
          fill="var(--color-balance)"
          fillOpacity={0.1}
          dot={false}
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
  currency = "CUP",
}: {
  data: Dashboard["categoryShare"];
  total: number;
  currency?: Currency;
}) {
  if (data.length === 0) return <EmptyChart />;
  const config = Object.fromEntries(
    data.map((s) => [s.key, { label: s.name, color: s.color }]),
  ) satisfies ChartConfig;

  return (
    <div className="flex flex-wrap items-center gap-7">
      <div className="relative mx-auto size-[172px] shrink-0 sm:mx-0">
        <ChartContainer config={config} className="aspect-square size-full">
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
                        {formatMoney(Number(value), currency)}
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
              innerRadius="72%"
              outerRadius="100%"
              strokeWidth={0}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="glass-strong pointer-events-none absolute inset-6 flex flex-col items-center justify-center rounded-full text-center leading-tight shadow-none">
          <span className="text-muted-foreground text-[11px]">Total</span>
          <span className="text-[15px] font-semibold tabular-nums">
            {formatMoney(total, currency)}
          </span>
        </div>
      </div>
      {/* Tabla: identidad y valores legibles sin depender del color. */}
      <ul className="flex min-w-[220px] flex-1 flex-col gap-[9px] text-[13px]">
        {data.map((s) => (
          <li key={s.key} className="grid grid-cols-[10px_1fr_auto_auto] items-center gap-2.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
            <span className="min-w-0">{s.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatNumber((s.total / total) * 100, 1)} %
            </span>
            <span className="min-w-[86px] text-right whitespace-nowrap tabular-nums">
              {formatMoney(s.total, currency)}
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
  currency = "CUP",
}: {
  data: Dashboard["monthly"];
  slots: Dashboard["slots"];
  currency?: Currency;
}) {
  const hasData = data.some((row) => slots.some((s) => Number(row[s.key as keyof typeof row]) > 0));
  if (!hasData) return <EmptyChart>Aún no hay gastos en los últimos 6 meses.</EmptyChart>;
  const config = Object.fromEntries(
    slots.map((s) => [s.key, { label: s.name, color: s.color }]),
  ) satisfies ChartConfig;
  const totals = new Map(
    data.map((row) => [
      row.month,
      slots.reduce((acc, s) => acc + Number(row[s.key as keyof typeof row] ?? 0), 0),
    ]),
  );

  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <BarChart data={data} margin={{ left: 0, right: 0, top: 8 }} barCategoryGap="22%">
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          height={40}
          interval={0}
          tick={<MonthTick totals={totals} />}
        />
        <YAxis hide />
        <ChartTooltip cursor={false} content={moneyTooltip(config, currency, formatMonth)} />
        {slots.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="spend"
            maxBarSize={46}
            fill={`var(--color-${s.key})`}
            stroke="var(--card)"
            strokeWidth={2}
            radius={i === slots.length - 1 ? [6, 6, 0, 0] : 0}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

/** Etiqueta del eje: mes y, debajo, el total del mes en formato compacto. */
function MonthTick({
  x,
  y,
  payload,
  totals,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  totals: Map<string, number>;
}) {
  const month = payload?.value ?? "";
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text textAnchor="middle" dy={10} className="fill-foreground text-xs">
        {formatMonth(month).replace(/ \d{4}$/, "")}
      </text>
      <text textAnchor="middle" dy={25} className="fill-muted-foreground text-[11px] tabular-nums">
        {compact.format(totals.get(month) ?? 0)}
      </text>
    </g>
  );
}

// ─── Tasa a la que se vendió USD ───

const rateConfig = { rate: { label: "Tasa", color: "var(--chart-1)" } } satisfies ChartConfig;

export function RateChart({ data }: { data: UsdDashboard["rateSeries"] }) {
  if (data.length === 0) return <EmptyChart>No hay ventas de USD en este periodo.</EmptyChart>;
  return (
    <ChartContainer config={rateConfig} className="aspect-auto h-[220px] w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
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
          dot={data.length < 20 ? { r: 4, strokeWidth: 2, fill: "var(--background)" } : false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

// ─── Barras horizontales (productos) ───

export function HorizontalBars({
  data,
  currency = "CUP",
}: {
  data: { name: string; total: number }[];
  currency?: Currency;
}) {
  if (data.length === 0) return <EmptyChart />;
  const max = Math.max(...data.map((d) => d.total));
  return (
    <ul className="flex flex-col gap-[15px]">
      {data.map((d) => (
        <li key={d.name} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate">{d.name}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatMoney(d.total, currency)}
            </span>
          </div>
          <div className="bg-muted h-2 rounded-full">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${max > 0 ? (d.total / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
