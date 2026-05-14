'use client';

import { useRef, useState, useEffect } from 'react';

interface NumberPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
}

export function NumberPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: NumberPickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);

  const numbers = Array.from(
    { length: Math.floor((max - min) / step) + 1 },
    (_, i) => min + i * step
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - e.clientY;
    const sensitivity = 3;
    const change = Math.round(deltaY / sensitivity) * step;
    const newValue = Math.max(min, Math.min(max, startValueRef.current + change));

    onChange(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, value]);

  // Calculate scroll position to keep selected number in center
  const selectedIndex = numbers.indexOf(value);
  const scrollOffset = selectedIndex * 48 + 24;

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="flex flex-col items-center gap-4">
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          className="relative w-24 h-48 bg-surface-elevated border-2 border-surface-border rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Highlight center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="h-12 w-full border-2 border-forge-500 bg-forge-500/10 rounded-lg" />
          </div>

          {/* Numbers - scroll with transform */}
          <div
            className="flex flex-col items-center pt-24 transition-transform duration-150"
            style={{
              transform: `translateY(-${scrollOffset}px)`,
            }}
          >
            {numbers.map((num) => (
              <div
                key={num}
                className="h-12 w-full flex items-center justify-center font-bold text-lg text-text-secondary"
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="text-4xl font-bold gradient-text">{value}</div>
          <div className="text-xs text-text-tertiary mt-1">Drag up/down</div>
        </div>
      </div>
    </div>
  );
}
