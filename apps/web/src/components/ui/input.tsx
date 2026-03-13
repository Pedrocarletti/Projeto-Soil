import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full rounded-[14px] border border-[#dbe3ca] bg-white px-4 py-3 text-sm text-[#21301c] outline-none transition placeholder:text-[#77866d] focus:border-[#7eb85f] focus:ring-2 focus:ring-[#7eb85f]/20',
      className,
    )}
    {...props}
  />
));

Input.displayName = 'Input';
