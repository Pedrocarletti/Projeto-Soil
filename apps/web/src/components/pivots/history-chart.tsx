'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { cn, formatDate, formatNumber } from '@/lib/utils';
import type { Pivot } from '@/types/domain';

type HistoryMetricKey = 'percentimeter' | 'appliedBlade' | 'angle';

const HISTORY_METRICS: Record<
  HistoryMetricKey,
  {
    label: string;
    unit: string;
    color: string;
    decimals: number;
    emptyLabel: string;
  }
> = {
  percentimeter: {
    label: 'Percentimetro',
    unit: '%',
    color: '#319747',
    decimals: 0,
    emptyLabel: 'Sem leitura de percentimetro',
  },
  appliedBlade: {
    label: 'Lamina',
    unit: 'mm',
    color: '#2ab0df',
    decimals: 1,
    emptyLabel: 'Sem leitura de lamina',
  },
  angle: {
    label: 'Angulo',
    unit: 'deg',
    color: '#94ad4f',
    decimals: 1,
    emptyLabel: 'Sem leitura de angulo',
  },
};

export function HistoryChart({ pivot }: { pivot: Pivot }) {
  const [metric, setMetric] = useState<HistoryMetricKey>('percentimeter');

  const cycles = useMemo(
    () =>
      pivot.states
        .flatMap((state) => state.cycles)
        .slice(0, 80)
        .reverse(),
    [pivot.states],
  );

  const latestCycle = cycles.at(-1);
  const selectedMetric = HISTORY_METRICS[metric];

  if (!cycles.length) {
    return (
      <Card className="bg-[#fffef8]">
        <p className="text-sm text-[#637866]">Sem historico de ciclos ainda.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-[#fffef8]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6d7e61]">
            Historico
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[#22311d]">
            Variacao operacional
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5e6d54]">
            Consulte as ultimas leituras registradas e alterne a metrica em foco.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:min-w-[320px]">
          {(Object.keys(HISTORY_METRICS) as HistoryMetricKey[]).map((metricKey) => {
            const metricConfig = HISTORY_METRICS[metricKey];
            const metricValue =
              latestCycle?.[metricKey] && typeof latestCycle[metricKey] === 'number'
                ? latestCycle[metricKey]
                : 0;

            return (
              <button
                key={metricKey}
                type="button"
                onClick={() => setMetric(metricKey)}
                className={cn(
                  'rounded-[18px] px-3 py-3 text-left transition',
                  metric === metricKey
                    ? 'bg-[#eef4db] shadow-[0_12px_22px_rgba(138,154,91,0.14)]'
                    : 'bg-[#f7f8f1] hover:bg-[#f1f5df]',
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8163]">
                  {metricConfig.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#22311d]">
                  {formatNumber(metricValue, {
                    maximumFractionDigits: metricConfig.decimals,
                  })}
                  {metricConfig.unit ? ` ${metricConfig.unit}` : ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(HISTORY_METRICS) as HistoryMetricKey[]).map((metricKey) => (
            <button
              key={metricKey}
              type="button"
              onClick={() => setMetric(metricKey)}
              className={cn(
                'rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition',
                metric === metricKey
                  ? 'text-white shadow-[0_10px_20px_rgba(76,112,48,0.18)]'
                  : 'bg-[#f1f5df] text-[#5e6d54] hover:bg-[#e8efd0]',
              )}
              style={
                metric === metricKey
                  ? { backgroundColor: HISTORY_METRICS[metricKey].color }
                  : undefined
              }
            >
              {HISTORY_METRICS[metricKey].label}
            </button>
          ))}
        </div>

        <div className="rounded-[18px] bg-[#f5f8eb] px-4 py-3 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8163]">
            Ultima leitura
          </p>
          <p className="mt-1 text-sm font-semibold text-[#22311d]">
            {formatNumber((latestCycle?.[metric] as number) ?? 0, {
              maximumFractionDigits: selectedMetric.decimals,
            })}
            {selectedMetric.unit ? ` ${selectedMetric.unit}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-5 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cycles}>
            <CartesianGrid
              stroke="#dfe7c9"
              strokeDasharray="3 6"
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) =>
                new Intl.DateTimeFormat('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(value))
              }
              tick={{ fill: '#6b7b60', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: '#7a8671', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={34}
            />
            <Tooltip
              labelFormatter={(value) => formatDate(String(value))}
              formatter={(value) => [
                `${formatNumber(Number(value), {
                  maximumFractionDigits: selectedMetric.decimals,
                })} ${selectedMetric.unit}`.trim(),
                selectedMetric.label,
              ]}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid #dfe7c9',
                background: '#fffef8',
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={selectedMetric.color}
              strokeWidth={3}
              activeDot={{ r: 5 }}
              dot={{ r: 3, fill: selectedMetric.color, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs text-[#7b8672]">
        Pressao ainda nao aparece aqui porque esse sensor nao esta presente no payload
        atual da API.
      </p>
    </Card>
  );
}
