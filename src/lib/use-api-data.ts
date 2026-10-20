"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    if (!url) return;
    setLoading(true);
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("request failed");
        return (await res.json()) as T;
      })
      .then((json) => {
        setData(json);
        setError("");
      })
      .catch(() => {
        setError("Gagal memuat data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  useEffect(() => {
    if (!url) return;
    let active = true;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("request failed");
        return (await res.json()) as T;
      })
      .then((json) => {
        if (active) {
          setData(json);
          setError("");
        }
      })
      .catch(() => {
        if (active) setError("Gagal memuat data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [url]);

  return { data, loading, error, reload };
}
