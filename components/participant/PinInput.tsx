"use client";

import { Input } from "@/components/ui/input";

export function PinInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        aria-invalid={!!error}
        aria-label="Game PIN"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="h-16 text-center font-heading text-[32px] font-bold tracking-[0.3em]"
      />
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
