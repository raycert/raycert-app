import { Button } from "@/components/ui/button";

/**
 * Dev/mock-only controls (§10) — never part of the real host UI. Clearly
 * labelled and visually separated (dashed border, muted corner) so it can't
 * be mistaken for a production control.
 */
export function HostDevMockControls({ onBumpResponseCount }: { onBumpResponseCount: () => void }) {
  return (
    <div className="fixed right-3 bottom-3 flex items-center gap-2 rounded-lg border border-dashed border-amber-500/60 bg-brand-900/90 px-3 py-2 text-[11px] text-amber-500">
      <span className="font-semibold tracking-wide uppercase">Dev mock</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 border-amber-500/60 px-2 text-[11px] text-amber-500 hover:bg-amber-500/10"
        onClick={onBumpResponseCount}
      >
        +1 response
      </Button>
    </div>
  );
}
