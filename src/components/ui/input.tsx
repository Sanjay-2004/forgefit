'use client';

import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3',
              'text-text-primary placeholder:text-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-forge-500/40 focus:border-forge-500/50',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-accent-red/50 focus:ring-accent-red/40',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-accent-red">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
