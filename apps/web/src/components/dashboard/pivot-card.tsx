import Link from 'next/link';
import { ArrowUpRight, Droplets, Gauge, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PivotWheel } from '@/components/pivots/pivot-wheel';
import { formatNumber } from '@/lib/utils';
import type { Pivot } from '@/types/domain';

export function PivotCard({ pivot }: { pivot: Pivot }) {
  return (
    <Link href={`/pivots/${pivot.id}`} className="block">
      <Card className="h-full border-none bg-[#319747] p-4 text-white shadow-[0_20px_34px_rgba(49,151,71,0.28)] lg:p-5">
        <div className="flex items-start gap-4">
          <PivotWheel
            angle={pivot.live.angle}
            percentimeter={pivot.live.percentimeter}
            size={78}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
                  {pivot.farm.name}
                </p>
                <h3 className="mt-1 truncate text-xl font-semibold">
                  {pivot.name}
                </h3>
              </div>
              <Badge tone={pivot.live.isOn ? 'success' : 'neutral'}>
                {pivot.live.isOn ? 'Ligado' : 'Parado'}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[16px] bg-white/14 px-3 py-2">
                <Gauge size={14} className="text-white/72" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">
                  Angulo
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatNumber(pivot.live.angle, { maximumFractionDigits: 1 })} deg
                </p>
              </div>

              <div className="rounded-[16px] bg-white/14 px-3 py-2">
                <Droplets size={14} className="text-white/72" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72">
                  Lamina
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {formatNumber(pivot.live.appliedBlade, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  mm
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/14 pt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/76">
          <span className="inline-flex items-center gap-2">
            <RotateCw size={14} />
            {pivot.live.isIrrigating ? 'Agua' : 'Movimento'}
          </span>
          <span className="inline-flex items-center gap-1">
            Detalhes
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Card>
    </Link>
  );
}
