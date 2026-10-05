import { useCallback, useEffect, useState } from "react";
import api from "../utils/api";

// Loads one read-only platform-panel endpoint (GET /platform<path>). Re-runs
// when the path or params change, ignores superseded responses, and exposes
// reload() for the Refresh buttons.
export default function usePlatformData(path, params) {
  const key = JSON.stringify(params ?? {});
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    api
      .get(`/platform${path}`, { params: JSON.parse(key) })
      .then((res) => {
        if (!cancelled) setState({ data: res.data, loading: false, error: "" });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({
          data: prev.data,
          loading: false,
          error: err.response?.data?.message || "Failed to load data",
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [path, key, tick]);

  return { ...state, reload };
}
