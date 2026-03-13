import { cn } from '@/lib/utils';

export function PivotWheel({
  angle,
  percentimeter,
  className,
  tileClassName,
  size = 88,
}: {
  angle: number;
  percentimeter: number;
  className?: string;
  tileClassName?: string;
  size?: number;
}) {
  const clampedAngle = ((angle % 360) + 360) % 360;
  const clampedPercentimeter = Math.max(8, Math.min(100, percentimeter));
  const blueSweep = Math.max(90, Math.min(170, 70 + clampedPercentimeter));
  const greenSweep = Math.min(280, blueSweep + 104);
  const gradient = `conic-gradient(from -90deg,
    #38b8e4 0deg ${blueSweep}deg,
    #c0d165 ${blueSweep}deg ${greenSweep}deg,
    #8b8b85 ${greenSweep}deg 360deg)`;

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-[24px] bg-[#836748] p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]',
        tileClassName,
      )}
      style={{ width: size + 12, height: size + 12 }}
    >
      <div
        className={cn(
          'relative rounded-full border-[4px] border-[#4f6b34] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.18)]',
          className,
        )}
        style={{
          width: size,
          height: size,
          background: gradient,
          transform: `rotate(${clampedAngle}deg)`,
        }}
      >
        <span className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f7f7ec] shadow-[0_0_0_3px_rgba(79,107,52,0.18)]" />
      </div>
    </div>
  );
}
