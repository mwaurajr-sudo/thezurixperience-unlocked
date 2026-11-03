import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/backend";

export interface PassesLeft {
  left: number;
  total: number;
}

// Live count from the backend. Goes down each time a guest confirms and a ticket is issued.
// Pass a value that changes to read the count again, such as a newly issued ticket's code.
export function usePassesLeft(refreshKey?: string) {
  const [passes, setPasses] = useState<PassesLeft | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/api/rsvp/availability`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.success) setPasses({ left: data.left, total: data.total });
      })
      .catch(() => {
        // Callers fall back to the tier's saved numbers
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return passes;
}
