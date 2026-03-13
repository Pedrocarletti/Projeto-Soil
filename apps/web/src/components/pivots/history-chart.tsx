'use client';

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
import { formatDate, formatNumber } from '@/lib/utils';
import type { Pivot } from '@/types/domain';

export function HistoryChart({ pivot }: { pivot: Pivot }) {
  const cycles = pivot.states
    .flatMap((state) => state.cycles)
    .slice(0, 80)
    .reverse();

  const latestCycle = cycles.at(-1);

  if (!cycles.length) {
    return (
      <Card className="bg-[#fffef8]">
        <p className="text-sm text-[#637866]">Sem historico de ciclos ainda.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-[#fffef8]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6d7e61]">
            Historico
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[#22311d]">
            Variacao operacional
          </h3>
        </div>

        <div className="rounded-[18px] bg-[#eef4db] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8163]">
            Ultimo angulo
          </p>
          <p className="mt-1 text-sm font-semibold text-[#22311d]">
            {formatNumber(latestCycle?.angle ?? 0, {
              maximumFractionDigits: 1,
            })}
            deg
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-[18px] bg-[#f1f5df] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8163]">
            Percentimetro
          </p>
          <p className="mt-1 text-sm font-semibold text-[#22311d]">
            {formatNumber(latestCycle?.percentimeter ?? 0, {
              maximumFractionDigits: 0,
            })}
            %
          </p>
        </div>
        <div className="rounded-[18px] bg-[#f1f5df] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6f8163]">
            Lamina
          </p>
          <p className="mt-1 text-sm font-semibold text-[#22311d]">
            {formatNumber(latestCycle?.appliedBlade ?? 0, {
              maximumFractionDigits: 1,
            })}{' '}
            mm
          </p>
        </div>
      </div>

      <div className="mt-4 h-[220px]">
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
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(value))
              }
              tick={{ fill: '#6b7b60', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis hide />
            <Tooltip
              labelFormatter={(value) => formatDate(String(value))}
              contentStyle={{
                borderRadius: 16,
                border: '1px solid #dfe7c9',
                background: '#fffef8',
              }}
            />
            <Line
              type="monotone"
              dataKey="angle"
              stroke="#2ab0df"
              strokeWidth={3}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="percentimeter"
              stroke="#319747"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
