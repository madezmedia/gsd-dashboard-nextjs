"use client";

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ShieldCheck, TrendingUp, CheckCircle2, ArrowRight, Zap, Award } from "lucide-react";

// --- Scene 1: The AI CTO Value Proposition ---
const CTOValueScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 18], [30, 0], { extrapolateRight: "clamp" });

  const statSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 85 },
  });

  const card1Spring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const card2Spring = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FBFAF5",
        color: "#0D1B2A",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "60px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Top Header Badge */}
      <div style={{ textAlign: "center", opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#D1FAE5",
            border: "1px solid #6EE7B7",
            color: "#065F46",
            padding: "10px 24px",
            borderRadius: "9999px",
            fontSize: "18px",
            fontWeight: 800,
            marginBottom: "24px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          <Award size={22} />
          <span>Fractional AI Leadership</span>
        </div>

        <h1
          style={{
            fontSize: "46px",
            fontWeight: 900,
            lineHeight: 1.15,
            color: "#0D1B2A",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Your On-Demand AI Chief Technology Officer
        </h1>
      </div>

      {/* Main Savings Stat Callout */}
      <div
        style={{
          transform: `scale(${Math.max(0, statSpring)})`,
          opacity: statSpring,
          backgroundColor: "#FFFFFF",
          border: "3px solid #10B981",
          borderRadius: "24px",
          padding: "36px 32px",
          width: "100%",
          boxShadow: "0 15px 40px -10px rgba(16, 185, 129, 0.18)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
          Net Annual Financial Impact
        </div>
        <div style={{ fontSize: "52px", fontWeight: 900, color: "#10B981", lineHeight: 1 }}>
          $162,000 / yr
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "#0D1B2A" }}>
          Net Savings vs In-House AI Lead
        </div>
      </div>

      {/* Comparison Pillars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
        {/* Full-time AI Lead Cost */}
        <div
          style={{
            transform: `scale(${Math.max(0, card1Spring)})`,
            opacity: card1Spring,
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: "16px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#991B1B" }}>Full-Time In-House AI Lead</div>
            <div style={{ fontSize: "14px", color: "#7F1D1D" }}>Salary + Equity + Benefits + Onboarding</div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#991B1B" }}>$180k+/yr</div>
        </div>

        {/* Retainer Model */}
        <div
          style={{
            transform: `scale(${Math.max(0, card2Spring)})`,
            opacity: card2Spring,
            backgroundColor: "#ECFDF5",
            border: "2px solid #10B981",
            borderRadius: "16px",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#047857" }}>Antigravity Retainer</div>
            <div style={{ fontSize: "14px", color: "#065F46" }}>On-Demand CTO + Direct Execution</div>
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#10B981" }}>$18k/yr</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 2: CTA & Booking Scene ---
const CTABookingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  
  const cardSpr = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const buttonSpr = spring({
    frame: frame - 40,
    fps,
    config: { damping: 10, stiffness: 110 },
  });

  const pulse = Math.sin(frame / 6) * 0.035 + 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FBFAF5",
        color: "#0D1B2A",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "60px 48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Top Header */}
      <div style={{ textAlign: "center", opacity: titleOpacity }}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#0D1B2A",
            color: "#FBFAF5",
            padding: "8px 22px",
            borderRadius: "9999px",
            fontSize: "16px",
            fontWeight: 800,
            marginBottom: "16px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Monthly Strategic Partner
        </div>
        <h2 style={{ fontSize: "42px", fontWeight: 900, color: "#0D1B2A", margin: 0, lineHeight: 1.15 }}>
          Monthly AI Coaching Retainer
        </h2>
      </div>

      {/* Main Retainer Card */}
      <div
        style={{
          transform: `scale(${Math.max(0, cardSpr)})`,
          opacity: cardSpr,
          backgroundColor: "#FFFFFF",
          border: "3px solid #0D1B2A",
          borderRadius: "24px",
          padding: "36px 28px",
          width: "100%",
          boxShadow: "0 15px 35px -5px rgba(13, 27, 42, 0.12)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
            Flat Rate Advisory
          </div>
          <div style={{ fontSize: "56px", fontWeight: 900, color: "#10B981", margin: "4px 0" }}>
            $1,500 <span style={{ fontSize: "24px", color: "#0D1B2A", fontWeight: 700 }}>/ mo</span>
          </div>
          <div style={{ fontSize: "15px", color: "#475569", fontWeight: 600 }}>Cancel Anytime • Zero Contracts</div>
        </div>

        {/* Feature List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
          {[
            "Direct Slack/Async Access to AI Chief Architect",
            "Weekly 1:1 Implementation & Audit Sprints",
            "Custom Workflow & API Integration Support",
            "Continuous Team Training & Prompt Engineering",
          ].map((feature, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "start", gap: "12px", fontSize: "16px", color: "#0D1B2A", fontWeight: 600 }}>
              <CheckCircle2 size={22} color="#10B981" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Big Call to Action Button */}
      <div
        style={{
          transform: `scale(${Math.max(0, buttonSpr * pulse)})`,
          opacity: buttonSpr,
          backgroundColor: "#10B981",
          color: "#FFFFFF",
          padding: "22px 32px",
          borderRadius: "20px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          boxShadow: "0 10px 30px -5px rgba(16, 185, 129, 0.4)",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: "22px", fontWeight: 800 }}>Book at mikeyshaw.work/coaching</span>
        <ArrowRight size={28} />
      </div>
    </AbsoluteFill>
  );
};

// --- Main Remotion Component ---
export const CoachingAdVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FBFAF5" }}>
      {/* Scene 1: 0 to 7.5s (0 to 225 frames) */}
      <Sequence from={0} durationInFrames={225}>
        <CTOValueScene />
      </Sequence>

      {/* Scene 2: 7.5 to 15s (225 to 450 frames) */}
      <Sequence from={225} durationInFrames={225}>
        <CTABookingScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export default CoachingAdVideo;
