/**
 * Large Game PIN display for Host Lobby (projector-friendly). Replaces the
 * earlier `PinDisplay` placeholder name from the handoff's component spec.
 */
export function GamePin({ pin, className }: { pin: string; className?: string }) {
  return (
    <div
      className={`font-heading text-[64px] font-extrabold leading-none tracking-[0.15em] text-white ${className ?? ""}`}
    >
      {pin}
    </div>
  );
}
