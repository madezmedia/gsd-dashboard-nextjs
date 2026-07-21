"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Maximize2,
  X,
  Film,
  CheckCircle2,
  Clock,
  Sliders,
  ShieldCheck,
  Video,
  Monitor,
} from "lucide-react";
import AssessmentAdVideo from "./AssessmentAdVideo";
import CoachingAdVideo from "./CoachingAdVideo";

// Dynamically import Remotion Player with SSR disabled for client-side rendering
const RemotionPlayer = dynamic(
  () => import("@remotion/player").then((mod) => mod.Player),
  { ssr: false }
);

export type VideoType = "assessment" | "coaching";

interface VideoMetadata {
  id: VideoType;
  title: string;
  subtitle: string;
  badge: string;
  durationSeconds: number;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  aspectRatio: string;
  component: React.FC;
  scenes: { name: string; timestamp: string; desc: string }[];
  keyHighlights: string[];
}

const VIDEOS: Record<VideoType, VideoMetadata> = {
  assessment: {
    id: "assessment",
    title: "AI Stack Assessment Motion Ad",
    subtitle: "30-Second High-ROI Operational Audit Advert",
    badge: "30s • 1080p • 30 FPS",
    durationSeconds: 30,
    durationInFrames: 900,
    fps: 30,
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    component: AssessmentAdVideo,
    scenes: [
      { name: "Scene 1: The Drain Hook", timestamp: "0:00 - 0:10", desc: "Highlights 260+ annual hours lost per employee and $120k+ waste." },
      { name: "Scene 2: The 7 AI Tools Audit", timestamp: "0:10 - 0:20", desc: "Reveals Fathom, Claude, Make.com, Perplexity, Descript, Notion & Freed." },
      { name: "Scene 3: Risk-Free Guarantee Offer", timestamp: "0:20 - 0:30", desc: "Showcases $499 assessment tier & 5+ hrs/wk reclaimed guarantee." },
    ],
    keyHighlights: [
      "Dynamic spring animations on data callouts",
      "7-Tool Evaluation Grid reveal effect",
      "Parchment & Emerald Kami design system",
    ],
  },
  coaching: {
    id: "coaching",
    title: "Fractional AI CTO Retainer Ad",
    subtitle: "15-Second Executive Leadership & Savings Advert",
    badge: "15s • 1080p • 30 FPS",
    durationSeconds: 15,
    durationInFrames: 450,
    fps: 30,
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    component: CoachingAdVideo,
    scenes: [
      { name: "Scene 1: Fractional CTO Value", timestamp: "0:00 - 0:07", desc: "Compares $180k/yr FTE cost vs $18k/yr retainer ($162k net savings)." },
      { name: "Scene 2: Retainer Offer & Booking", timestamp: "0:07 - 0:15", desc: "$1,500/mo flat advisory with direct Slack access & weekly sprints." },
    ],
    keyHighlights: [
      "In-House vs Retainer ROI table comparison",
      "Pulsing CTA button with instant booking URL",
      "Clean Kami Ink & Emerald styling",
    ],
  },
};

interface VideoPosterPreviewProps {
  initialVideo?: VideoType;
  showSelector?: boolean;
  className?: string;
}

export function VideoPosterPreview({
  initialVideo = "assessment",
  showSelector = true,
  className = "",
}: VideoPosterPreviewProps) {
  const [activeVideoKey, setActiveVideoKey] = useState<VideoType>(initialVideo);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const activeVideo = VIDEOS[activeVideoKey];

  return (
    <div className={`w-full bg-[#FFFFFF] border border-[#E5E3D7] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 ${className}`}>
      {/* Top Header & Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E3D7] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#065F46] text-xs font-mono font-semibold uppercase tracking-wider">
            <Film className="w-3.5 h-3.5 text-[#10B981]" />
            Remotion Motion Asset Player
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#0D1B2A]">
            Programmatic Video Motion Assets
          </h3>
          <p className="text-xs text-[#4A5560]">
            Interactive client-facing motion graphics rendered in real-time with React & Remotion.
          </p>
        </div>

        {showSelector && (
          <div className="flex items-center gap-2 bg-[#F5F4ED] p-1.5 rounded-xl border border-[#E5E3D7] shrink-0">
            <button
              type="button"
              onClick={() => setActiveVideoKey("assessment")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeVideoKey === "assessment"
                  ? "bg-[#2D4A3E] text-[#FBFAF5] shadow-xs"
                  : "text-[#4A5560] hover:text-[#0D1B2A]"
              }`}
            >
              Assessment Ad (30s)
            </button>
            <button
              type="button"
              onClick={() => setActiveVideoKey("coaching")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                activeVideoKey === "coaching"
                  ? "bg-[#2D4A3E] text-[#FBFAF5] shadow-xs"
                  : "text-[#4A5560] hover:text-[#0D1B2A]"
              }`}
            >
              Coaching Ad (15s)
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Player + Spec Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Remotion Inline Player Container */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative group bg-[#0D1B2A] rounded-xl overflow-hidden border border-[#2D4A3E] shadow-md aspect-video flex items-center justify-center">
            {isMounted ? (
              <RemotionPlayer
                component={activeVideo.component}
                durationInFrames={activeVideo.durationInFrames}
                compositionWidth={activeVideo.width}
                compositionHeight={activeVideo.height}
                fps={activeVideo.fps}
                controls
                loop
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-[#E5E3D7] space-y-3">
                <Video className="w-10 h-10 text-[#10B981] animate-pulse" />
                <span className="text-xs font-mono">Loading Remotion Engine...</span>
              </div>
            )}

            {/* Expand / Popout Overlay Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute top-3 right-3 bg-[#0D1B2A]/80 hover:bg-[#0D1B2A] text-[#FBFAF5] p-2 rounded-lg border border-[#10B981]/40 text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all shadow-sm z-10"
              title="Expand to Fullscreen Preview Modal"
            >
              <Maximize2 className="w-4 h-4 text-[#10B981]" />
              <span className="hidden sm:inline">Popout Modal</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#7A8694] px-1">
            <span className="flex items-center gap-1">
              <Monitor className="w-3.5 h-3.5 text-[#10B981]" />
              Format: {activeVideo.width}x{activeVideo.height} ({activeVideo.aspectRatio})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#2D4A3E]" />
              Duration: {activeVideo.durationSeconds}s ({activeVideo.durationInFrames} frames)
            </span>
          </div>
        </div>

        {/* Right Column: Asset Specifications & Scene Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#10B981] font-bold uppercase tracking-wider">
                {activeVideo.badge}
              </span>
              <span className="text-[11px] font-mono bg-[#F5F4ED] text-[#2D4A3E] px-2.5 py-0.5 rounded border border-[#E5E3D7] font-semibold">
                Kami Parchment Theme
              </span>
            </div>
            <h4 className="font-serif text-xl font-bold text-[#0D1B2A]">
              {activeVideo.title}
            </h4>
            <p className="text-xs text-[#4A5560] leading-relaxed">
              {activeVideo.subtitle}
            </p>
          </div>

          {/* Timeline Breakdown */}
          <div className="space-y-3 bg-[#FBFAF5] p-4 rounded-xl border border-[#E5E3D7]">
            <div className="text-xs font-mono text-[#0D1B2A] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
              Scene Timeline Breakdown
            </div>
            <div className="space-y-2.5">
              {activeVideo.scenes.map((scene, idx) => (
                <div key={idx} className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#E5E3D7] space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#0D1B2A]">
                    <span>{scene.name}</span>
                    <span className="font-mono text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
                      {scene.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A5560] leading-tight">{scene.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Motion Highlights */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-[#0D1B2A] font-bold uppercase tracking-wider">
              Technical Highlights
            </div>
            <ul className="space-y-1.5">
              {activeVideo.keyHighlights.map((hl, idx) => (
                <li key={idx} className="text-xs text-[#0D1B2A] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>{hl}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Popout Trigger Callout */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 rounded-lg bg-[#2D4A3E] text-[#FBFAF5] font-semibold text-xs hover:bg-[#1A2E26] transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Maximize2 className="w-4 h-4 text-[#10B981]" />
            Launch Cinema Preview Modal
          </button>
        </div>
      </div>

      {/* MODAL PLAYER OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-[#0D1B2A]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-5xl bg-[#FBFAF5] border-2 border-[#10B981] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#F5F4ED] border-b border-[#E5E3D7]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2D4A3E] text-[#10B981] flex items-center justify-center font-mono font-bold">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-bold text-[#0D1B2A]">
                    {activeVideo.title} — Remotion Cinema Player
                  </h4>
                  <span className="text-xs font-mono text-[#7A8694]">
                    {activeVideo.badge} • Interactive Controls Enabled
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg bg-[#FFFFFF] hover:bg-[#EBE8DC] border border-[#E5E3D7] text-[#0D1B2A] transition-colors"
                title="Close Modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Large Player */}
            <div className="p-6 bg-[#0D1B2A] flex items-center justify-center overflow-hidden">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#2D4A3E] shadow-xl">
                {isMounted && (
                  <RemotionPlayer
                    component={activeVideo.component}
                    durationInFrames={activeVideo.durationInFrames}
                    compositionWidth={activeVideo.width}
                    compositionHeight={activeVideo.height}
                    fps={activeVideo.fps}
                    controls
                    autoPlay
                    loop
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#F5F4ED] border-t border-[#E5E3D7] flex items-center justify-between text-xs font-mono text-[#4A5560]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                Kami Parchment Motion Spec • Zero Purple Guarantee
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#2D4A3E] text-[#FBFAF5] font-bold hover:bg-[#1A2E26] transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoPosterPreview;
