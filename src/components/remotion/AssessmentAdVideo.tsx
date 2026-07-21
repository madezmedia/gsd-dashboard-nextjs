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
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Zap, ShieldCheck } from "lucide-react";

// --- Scene 1: The Bottleneck Hook ---
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" });

  const cardSpring = spring({
    frame: frame - 25,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const statSpring = spring({
    frame: frame - 50,
    fps,
    config: { damping: 12, stiffness: 90 },
  });

  const listOpacity = interpolate(frame, [80, 105], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FBFAF5",
        color: "#0D1B2A",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "60px 90px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Top Badge */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          color: "#991B1B",
          padding: "10px 24px",
          borderRadius: "9999px",
          fontWeight: 700,
          fontSize: "20px",
          marginBottom: "32px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        <AlertTriangle size={24} color="#991B1B" />
        <span>Operations Warning</span>
      </div>

      {/* Main Hook Headline */}
      <h1
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: "56px",
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.15,
          color: "#0D1B2A",
          maxWidth: "1150px",
          marginBottom: "48px",
          letterSpacing: "-0.02em",
        }}
      >
        Are your employees losing{" "}
        <span style={{ color: "#DC2626", textDecoration: "underline", textDecorationColor: "#FCA5A5" }}>
          5+ hours/week
        </span>{" "}
        to manual tasks AI solved years ago?
      </h1>

      {/* Grid Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "36px",
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        {/* Card 1: Time Waste */}
        <div
          style={{
            transform: `scale(${Math.max(0, cardSpring)})`,
            opacity: cardSpring,
            backgroundColor: "#FFFFFF",
            border: "2px solid #E5E3D8",
            borderRadius: "20px",
            padding: "36px",
            boxShadow: "0 10px 30px -5px rgba(13, 27, 42, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "#FEF3C7",
                padding: "14px",
                borderRadius: "14px",
                color: "#D97706",
              }}
            >
              <Clock size={36} />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                Annual Drain
              </div>
              <div style={{ fontSize: "38px", fontWeight: 800, color: "#0D1B2A" }}>
                260+ Hours / Yr
              </div>
            </div>
          </div>
          <p style={{ fontSize: "20px", color: "#334155", margin: 0, lineHeight: 1.4 }}>
            Lost per employee on repetitive manual data entry, meeting notes, and email synthesis.
          </p>
        </div>

        {/* Card 2: Financial Impact */}
        <div
          style={{
            transform: `scale(${Math.max(0, statSpring)})`,
            opacity: statSpring,
            backgroundColor: "#FFFFFF",
            border: "2px solid #E5E3D8",
            borderRadius: "20px",
            padding: "36px",
            boxShadow: "0 10px 30px -5px rgba(13, 27, 42, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                backgroundColor: "#D1FAE5",
                padding: "14px",
                borderRadius: "14px",
                color: "#10B981",
              }}
            >
              <Zap size={36} />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
                Team Impact (10 People)
              </div>
              <div style={{ fontSize: "38px", fontWeight: 800, color: "#10B981" }}>
                $120,000+ Waste
              </div>
            </div>
          </div>
          <p style={{ fontSize: "20px", color: "#334155", margin: 0, lineHeight: 1.4 }}>
            Uncaptured profit buried under outdated administrative workflows.
          </p>
        </div>
      </div>

      {/* Bottom Common Bottlenecks */}
      <div
        style={{
          opacity: listOpacity,
          marginTop: "40px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          backgroundColor: "#F4F3ED",
          padding: "16px 32px",
          borderRadius: "16px",
          border: "1px solid #E2E0D4",
        }}
      >
        <span style={{ fontSize: "18px", fontWeight: 700, color: "#0D1B2A" }}>Common Leaks:</span>
        {["Manual Copy-Paste", "Unstructured Meeting Notes", "Repetitive Email Drafting"].map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "18px", color: "#475569", fontWeight: 500 }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444" }} />
            {item}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 2: The 7 AI Tools Reveal ---
const ToolsRevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp" });

  const tools = [
    { name: "Fathom", desc: "Automated Meeting Notes & Transcripts", category: "Meetings", tagBg: "#ECFDF5", tagText: "#047857" },
    { name: "Claude Team", desc: "Advanced Reasoning & Intelligence", category: "Strategy", tagBg: "#F0FDF4", tagText: "#15803D" },
    { name: "Make.com", desc: "No-Code API & System Workflows", category: "Automation", tagBg: "#ECFDF5", tagText: "#047857" },
    { name: "Perplexity", desc: "Deep Technical & Market Research", category: "Intelligence", tagBg: "#F0FDF4", tagText: "#15803D" },
    { name: "Descript", desc: "AI Audio & Video Editing Engine", category: "Media", tagBg: "#ECFDF5", tagText: "#047857" },
    { name: "Notion AI", desc: "Connected Enterprise Knowledge Base", category: "Docs", tagBg: "#F0FDF4", tagText: "#15803D" },
    { name: "Freed AI", desc: "Automated Workflow Documentation", category: "Operations", tagBg: "#ECFDF5", tagText: "#047857" },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FBFAF5",
        color: "#0D1B2A",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "50px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "36px", opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#D1FAE5",
            color: "#047857",
            padding: "8px 20px",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: "18px",
            marginBottom: "14px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Proven Stack Evaluation
        </div>
        <h2 style={{ fontSize: "48px", fontWeight: 800, color: "#0D1B2A", margin: 0 }}>
          The 7 Core AI Tools We Audit & Deploy
        </h2>
        <p style={{ fontSize: "20px", color: "#475569", marginTop: "8px" }}>
          We evaluate your existing stack and seamlessly integrate high-ROI AI tools.
        </p>
      </div>

      {/* Grid of 7 Tools */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          width: "100%",
          maxWidth: "1300px",
        }}
      >
        {tools.map((tool, index) => {
          const delay = index * 10;
          const cardSpr = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14, stiffness: 100 },
          });

          // Span the last item across if odd count or center it nicely
          const isLast = index === 6;

          return (
            <div
              key={tool.name}
              style={{
                gridColumn: isLast ? "2 / 3" : "auto",
                transform: `scale(${Math.max(0, cardSpr)})`,
                opacity: cardSpr,
                backgroundColor: "#FFFFFF",
                border: "2px solid #E5E3D8",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 4px 20px -2px rgba(13, 27, 42, 0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "26px", fontWeight: 800, color: "#0D1B2A" }}>{tool.name}</span>
                <span
                  style={{
                    backgroundColor: tool.tagBg,
                    color: tool.tagText,
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {tool.category}
                </span>
              </div>
              <p style={{ fontSize: "16px", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                {tool.desc}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10B981", fontSize: "14px", fontWeight: 700, marginTop: "4px" }}>
                <CheckCircle2 size={16} />
                <span>ROI Assessed</span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 3: The Offer & Guarantee ---
const OfferScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const cardSpr = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 85 },
  });

  const buttonSpr = spring({
    frame: frame - 40,
    fps,
    config: { damping: 10, stiffness: 110 },
  });

  const pulse = Math.sin(frame / 6) * 0.03 + 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FBFAF5",
        color: "#0D1B2A",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "60px 90px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          opacity: titleOpacity,
          backgroundColor: "#D1FAE5",
          border: "1px solid #6EE7B7",
          color: "#065F46",
          padding: "10px 28px",
          borderRadius: "9999px",
          fontSize: "20px",
          fontWeight: 800,
          marginBottom: "28px",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <ShieldCheck size={24} />
        <span>Risk-Free Efficiency Audit</span>
      </div>

      {/* Hero Offer Box */}
      <div
        style={{
          transform: `scale(${Math.max(0, cardSpr)})`,
          opacity: cardSpr,
          backgroundColor: "#FFFFFF",
          border: "3px solid #10B981",
          borderRadius: "28px",
          padding: "48px 64px",
          width: "100%",
          maxWidth: "1100px",
          boxShadow: "0 20px 50px -10px rgba(16, 185, 129, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Antigravity Operations Special
        </div>

        <div style={{ fontSize: "72px", fontWeight: 900, color: "#0D1B2A", margin: "12px 0 8px 0" }}>
          $499 <span style={{ fontSize: "32px", color: "#475569", fontWeight: 600 }}>AI Tools Assessment</span>
        </div>

        {/* Guarantee Pill */}
        <div
          style={{
            backgroundColor: "#0D1B2A",
            color: "#FBFAF5",
            padding: "12px 32px",
            borderRadius: "16px",
            fontSize: "24px",
            fontWeight: 800,
            marginTop: "12px",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ color: "#10B981" }}>★</span>
          <span>5+ Hours/Wk Reclaimed Guarantee</span>
          <span style={{ color: "#10B981" }}>★</span>
        </div>

        {/* What's Included */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            width: "100%",
            marginBottom: "40px",
            textAlign: "left",
          }}
        >
          {[
            { title: "Full Workflow Audit", desc: "Identify every manual bottleneck across your team." },
            { title: "Tailored Tool Roadmap", desc: "Specific blueprint for Fathom, Claude, Make & more." },
            { title: "1-on-1 Strategy Session", desc: "Direct walk-through with immediate ROI action plan." },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#F9F8F3",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #E5E3D8",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#0D1B2A", fontSize: "18px", marginBottom: "6px" }}>
                <CheckCircle2 size={20} color="#10B981" />
                {item.title}
              </div>
              <div style={{ fontSize: "15px", color: "#475569", lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Big CTA Button */}
        <div
          style={{
            transform: `scale(${Math.max(0, buttonSpr * pulse)})`,
            opacity: buttonSpr,
            backgroundColor: "#10B981",
            color: "#FFFFFF",
            padding: "20px 48px",
            borderRadius: "18px",
            fontSize: "28px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "16px",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
            cursor: "pointer",
          }}
        >
          <span>Book at mikeyshaw.work/assessment</span>
          <ArrowRight size={32} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Main Remotion Component ---
export const AssessmentAdVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FBFAF5" }}>
      {/* Scene 1: 0 to 10s (0 to 300 frames) */}
      <Sequence from={0} durationInFrames={300}>
        <HookScene />
      </Sequence>

      {/* Scene 2: 10 to 20s (300 to 600 frames) */}
      <Sequence from={300} durationInFrames={300}>
        <ToolsRevealScene />
      </Sequence>

      {/* Scene 3: 20 to 30s (600 to 900 frames) */}
      <Sequence from={600} durationInFrames={300}>
        <OfferScene />
      </Sequence>
    </AbsoluteFill>
  );
};

export default AssessmentAdVideo;
