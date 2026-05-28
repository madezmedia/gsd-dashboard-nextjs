"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ROUTE_MAP: Record<string, string> = {
  "1": "/",
  "2": "/agents",
  "3": "/workflows",
  "4": "/voice",
  "5": "/a2a",
  "6": "/approvals",
  "7": "/settings",
};

export function ShortcutHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Intercept Ctrl + 1-7 or Cmd + 1-7 (on Mac)
      if ((e.ctrlKey || e.metaKey) && ROUTE_MAP[e.key]) {
        // Prevent default browser tab switching
        e.preventDefault();
        const route = ROUTE_MAP[e.key];
        const href = token ? `${route}?token=${token}` : route;
        router.push(href);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, token]);

  return null;
}
