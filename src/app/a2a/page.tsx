import { Suspense } from "react";
import A2AClient from "./a2a-client";

export default function A2APage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-[#1a1a1a]/60">
          Initializing relational trace graph...
        </div>
      }
    >
      <A2AClient />
    </Suspense>
  );
}
