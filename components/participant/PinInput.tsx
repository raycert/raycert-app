"use client";

import { Input } from "@/components/ui/input";

export function PinInput({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="game-pin" className="sr-only">
        Game PIN
      </label>
      <Input
        id="game-pin"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        aria-invalid={!!error}
        aria-describedby={error ? "game-pin-error" : undefined}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="h-16 text-center font-heading text-[32px] font-bold tracking-[0.3em]"
      />
      {error ? (
        <p id="game-pin-error" role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
