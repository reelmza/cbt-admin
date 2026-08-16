"use client";

import { useEffect, useRef, useState } from "react";

export type CardData<T> = {
  data: T | null;
  loading: boolean;
  failed: boolean;
  reload: () => void;
};

/*
 * There is no aggregate dashboard endpoint, so the page stitches one together
 * from several list endpoints. Each card owns exactly one request through this
 * hook, so a single endpoint failing only empties its own card and can be
 * retried on its own instead of reloading the whole page.
 */
export const useCardData = <T,>(
  load: (signal: AbortSignal) => Promise<T>,
  ready: boolean,
): CardData<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Held in a ref so an inline loader does not re-trigger the effect each render
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setFailed(false);

      try {
        const result = await loadRef.current(controller.signal);
        if (controller.signal.aborted) return;
        setData(result);
      } catch {
        if (controller.signal.aborted) return;
        setFailed(true);
      }

      if (!controller.signal.aborted) setLoading(false);
    };

    run();

    return () => controller.abort();
  }, [ready, attempt]);

  return { data, loading, failed, reload: () => setAttempt((n) => n + 1) };
};
