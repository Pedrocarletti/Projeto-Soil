import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-1.5 rounded-full"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#637866]">
            {label}
          </p>
          <p className="mt-4 text-3xl font-semibold text-[#18331f]">{value}</p>
        </div>
        <div className="rounded-2xl bg-[#f0e6d0] p-3 text-[#234d32]">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}
