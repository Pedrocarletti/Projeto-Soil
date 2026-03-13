import { cn } from '@/lib/utils';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
        tone === 'success' && 'bg-[#319747] text-white',
        tone === 'warning' && 'bg-[#e35c5c] text-white',
        tone === 'neutral' && 'bg-[#edf3da] text-[#516244]',
      )}
    >
      {children}
    </span>
  );
}
