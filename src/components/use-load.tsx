"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs an async loader on mount and whenever `key` changes; exposes
 * data, error and reload. The latest loader is always used.
 */
export function useLoad<T>(loader: () => Promise<T>, key: unknown = null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async () => {
    try {
      setData(await loaderRef.current());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let live = true;
    loaderRef
      .current()
      .then((d) => {
        if (live) {
          setData(d);
          setError(null);
        }
      })
      .catch((err) => live && setError((err as Error).message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [key]);

  return { data, error, loading, reload };
}

export function LoadError({ message }: { message: string }) {
  return (
    <div className="container max-w-xl py-20 text-center">
      <p className="font-semibold">Couldn&apos;t load this page.</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}
