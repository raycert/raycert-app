"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

/**
 * Shared debounced-autosave engine for the Quiz and Assessment editors
 * (Phase 10C). Watches `value`; `delayMs` after it stops changing, calls
 * `save(value)` against the real Supabase-backed Server Action and tracks
 * "Chưa lưu → Đang lưu… → Đã lưu" status — never faking "Đã lưu" on failure,
 * per spec. `flush()` cancels any pending debounce and saves immediately,
 * for an explicit "Save & Close" action that must confirm persistence
 * before navigating away.
 */
export function useDebouncedSave<T>(
  value: T,
  save: (value: T) => Promise<{ error?: string }>,
  delayMs = 900
) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFirstRender = useRef(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef(value);
  const saveRef = useRef(save);
  // Bumped on every real value change so a save that resolves after newer
  // edits already landed doesn't stomp the status back to "saved".
  const versionRef = useRef(0);

  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const runSave = useCallback(async (): Promise<{ error?: string }> => {
    const startVersion = versionRef.current;
    setStatus("saving");
    const result = await saveRef.current(latestValue.current);
    const supersededByNewerEdit = versionRef.current !== startVersion;

    if (result.error) {
      setErrorMessage(result.error);
      if (!supersededByNewerEdit) setStatus("error");
      return result;
    }

    setErrorMessage(null);
    if (!supersededByNewerEdit) setStatus("saved");
    return result;
  }, []);

  const flush = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    return runSave();
  }, [runSave]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    versionRef.current += 1;
    setStatus("unsaved");
    setErrorMessage(null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void runSave();
    }, delayMs);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs]);

  return { status, errorMessage, flush };
}
