'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center rounded-[16px] text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7eb85f]/35 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[#319747] px-5 py-3 text-[#fffef8] shadow-[0_14px_28px_rgba(49,151,71,0.24)] hover:bg-[#287d3b]',
        secondary:
          'border border-[#d7e0c3] bg-[#fffef8] px-5 py-3 text-[#294124] hover:bg-white',
        ghost: 'px-4 py-2 text-[#526348] hover:bg-[#edf3da]',
      },
      size: {
        default: '',
        sm: 'px-3 py-2 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
