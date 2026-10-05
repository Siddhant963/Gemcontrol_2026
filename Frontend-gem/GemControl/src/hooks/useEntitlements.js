import { useEffect, useState } from "react";
import api from "../utils/api";

// What the firm's CURRENT plan allows, as reported by the backend
// (GET /getMySubscription -> entitlements). The backend enforces these rules;
// this only lets a page explain a limit and disable the matching button.
//   { girvi: boolean, staffLimit: number (0 = unlimited), staffUsed: number }
// `entitlements` is null until loaded (or if the call fails) -- pages must
// treat null as "don't block", so a failed lookup never locks anyone out.
export default function useEntitlements() {
  const [entitlements, setEntitlements] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/getMySubscription")
      .then((res) => {
        if (!cancelled) setEntitlements(res.data?.entitlements ?? null);
      })
      .catch(() => {
        if (!cancelled) setEntitlements(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return entitlements;
}
