"use client";

import { useCallback, useEffect, useState } from "react";

/** Persists a set of string ids to localStorage — used for demo interactions
 * like reserved events, saved creators/projects and sent applications. */
export function useLocalSet(key: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setIds(new Set(JSON.parse(raw)));
    } catch {
      // ignore malformed/unavailable storage
    }
    setHydrated(true);
  }, [key]);

  const persist = useCallback(
    (next: Set<string>) => {
      setIds(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(Array.from(next)));
      } catch {
        // storage unavailable — keep in-memory state only
      }
    },
    [key]
  );

  const has = useCallback((id: string) => ids.has(id), [ids]);

  const add = useCallback(
    (id: string) => {
      const next = new Set(ids);
      next.add(id);
      persist(next);
    },
    [ids, persist]
  );

  const toggle = useCallback(
    (id: string) => {
      const next = new Set(ids);
      next.has(id) ? next.delete(id) : next.add(id);
      persist(next);
    },
    [ids, persist]
  );

  return { ids, hydrated, has, add, toggle };
}
