import { Suspense } from "react";
import VoiceClient from "./voice-client";

export default function VoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 font-mono text-xs uppercase animate-pulse text-[#1a1a1a]/60">
          Initializing voice channel...
        </div>
      }
    >
      <VoiceClient />
    </Suspense>
  );
}
