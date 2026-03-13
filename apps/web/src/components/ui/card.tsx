import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-[#dde5c9] bg-[#fffef8] p-4 shadow-[0_12px_32px_rgba(40,59,26,0.08)]',
        className,
      )}
      {...props}
    />
  );
}
