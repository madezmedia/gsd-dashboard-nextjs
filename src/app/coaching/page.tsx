"use client";

import React, { useState, useId } from "react";
import { trackCoachingEnrollment, trackRoiCalculatorInteraction } from "@/lib/analytics";
import {
  MessageSquare,
  Video,
  ShieldCheck,
  Zap,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Award,
  Layers,
  Calendar,
  ChevronRight,
  CheckSquare,
  BadgeDollarSign,
  Briefcase,
  BookOpen,
} from "lucide-react";

interface RetainerPillar {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  deliverables: string[];
  cadence: string;
  valueProp: string;
}

const RETAINER_PILLARS: RetainerPillar[] = [
  {
    id: "strategy-sessions",
    title: "1-on-1 Strategy Sessions",
    subtitle: "Bi-Weekly Executive Deep-Dives",
    iconName: "Video",
    deliverables: [
      "Two 60-minute live 1-on-1 strategy calls per month with senior AI engineer",
      "Custom workflow architecture & roadmap design",
      "Executive alignment on AI tool adoption & compliance",
      "Recorded video replays with searchable AI summaries",
    ],
    cadence: "Bi-weekly (2x per month)",
    valueProp: "Direct access to senior AI engineering counsel to navigate architectural trade-offs.",
  },
  {
    id: "slack-support",
    title: "Async Slack Support",
    subtitle: "Direct Sub-4-Hour Response Team",
    iconName: "MessageSquare",
    deliverables: [
      "Dedicated private Slack or Discord channel for your key team members",
      "Sub-4-hour response SLA during business hours for rapid unblocking",
      "Live prompt debugging, code review, and script tweaking",
      "On-demand tool recommendation & integration advice",
    ],
    cadence: "Continuous (Mon-Fri)",
    valueProp: "Never get stuck on broken prompts or integration bugs again.",
  },
  {
    id: "stack-auditing",
    title: "SaaS Stack Auditing",
    subtitle: "Continuous Cost & Model Pruning",
    iconName: "Layers",
    deliverables: [
      "Monthly audit of recurring SaaS & AI software subscriptions",
      "Identification and elimination of overlapping or redundant AI tools",
      "Evaluation of newly released LLMs (Claude 3.5, Gemini 1.5, GPT-4o)",
      "Vendor price negotiation & tier optimization advice",
    ],
    cadence: "Monthly Audit Cycle",
    valueProp: "Save $500–$2,000/mo in unused SaaS bloat while upgrading tool capability.",
  },
  {
    id: "prompt-library",
    title: "Production Prompt Library",
    subtitle: "Vault of 100+ Enterprise Blueprints",
    iconName: "BookOpen",
    deliverables: [
      "Full access to Mad EZ's internal prompt vault (100+ production-grade prompts)",
      "Weekly updates with newly engineered agent templates & system prompts",
      "Custom prompt customization for your specific business domain",
      "Standard operating procedure (SOP) documentation for team execution",
    ],
    cadence: "Unlimited Instant Access",
    valueProp: "Deploy battle-tested prompts instantly without spending weeks on trial-and-error.",
  },
];

const WEEKLY_CADENCE = [
  {
    week: "Week 1",
    phase: "Audit & Alignment",
    title: "Strategic Stack & Workflow Audit",
    description: "60-min strategy call to review team bottlenecks, audit active tools, and set the monthly implementation milestone.",
  },
  {
    week: "Week 2",
    phase: "Build & Engineer",
    title: "Custom Prompt & Agent Engineering",
    description: "Our engineers build custom prompts, automation scripts, and SOP documentation tailored to your Week 1 targets.",
  },
  {
    week: "Week 3",
    phase: "Train & Onboard",
    title: "Team SOP Training & Adoption",
    description: "Hands-on team walkthrough session and Slack roll-out ensuring every team member masters the new workflows.",
  },
  {
    week: "Week 4",
    phase: "Measure & Optimize",
    title: "Productivity Metrics & Stack Pruning",
    description: "Review hours saved, measure output quality, prune redundant SaaS tools, and prep next month's sprint targets.",
  },
];

const COACHING_FAQS = [
  {
    question: "Is there a long-term contract commitment?",
    answer: "No. The Monthly AI Coaching Retainer is billed month-to-month at $1,500/month. You can pause or cancel at any time with zero penalty or hassle.",
  },
  {
    question: "Who from our team can participate in the coaching?",
    answer: "Up to 5 key team members (Execs, Ops Leads, Department Heads) can join the live 1-on-1 strategy sessions and access our dedicated Slack channel.",
  },
  {
    question: "How does this differ from the $499 / $1,299 AI Assessment?",
    answer: "The Assessment is a one-time diagnostic snapshot. The Coaching Retainer is an ongoing execution partnership providing continuous guidance, monthly workflow builds, direct Slack support, and updated prompt libraries.",
  },
  {
    question: "What kind of tools do you help us implement?",
    answer: "We support the entire modern AI ecosystem including Claude, ChatGPT Enterprise, Perplexity, Fathom, Make.com, Zapier, Notion AI, Descript, and custom API-driven workflows.",
  },
  {
    question: "What is the turnaround time on Slack requests?",
    answer: "During normal business hours (8am - 6pm EST), our average Slack response time is under 2 hours, with a guaranteed SLA of sub-4-hours for prompt debugging and workflow support.",
  },
];

export default function CoachingPage() {
  const [selectedPillarId, setSelectedPillarId] = useState<string>("strategy-sessions");
  const [teamSizeForRoi, setTeamSizeForRoi] = useState<number>(10);

  const roiTeamSliderId = useId();

  const activePillar = RETAINER_PILLARS.find((p) => p.id === selectedPillarId) || RETAINER_PILLARS[0];

  // In-house FTE AI lead costs ~$150k base + $30k benefits = $180k/yr
  const fteCostPerYear = 180000;
  const retainerCostPerYear = 1800; // $1,500 * 12 = $18,000/yr
  const netRetainerSavingsPerYear = fteCostPerYear - 18000;
  const estimatedHoursSavedMonthly = teamSizeForRoi * 16; // 4 hrs/wk * 4 wks = 16 hrs/mo/emp
  const estimatedMonthlyLaborValuation = estimatedHoursSavedMonthly * 50; // $50/hr

  return (
    <div className="w-full min-h-screen bg-[#FBFAF5] text-[#0D1B2A] font-sans antialiased selection:bg-[#10B981]/20 selection:text-[#0D1B2A]">
      {/* Top Banner */}
      <header className="border-b border-[#E5E3D7] bg-[#F5F4ED] py-2.5 px-4 sm:px-8 text-xs font-mono tracking-wide text-[#4A5560] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-semibold text-[#0D1B2A] uppercase">Mad EZ AI Retainer</span>
          <span className="hidden md:inline text-[#7A8694]">|</span>
          <span className="hidden md:inline">Monthly AI Engineering & Strategy Partnership</span>
        </div>
        <div className="flex items-center gap-4 text-[#2D4A3E] font-medium">
          <span className="flex items-center gap-1 font-mono">
            <Users className="w-3.5 h-3.5 text-[#10B981]" /> 3 Cohort Spots Open
          </span>
          <span className="hidden sm:flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> Month-to-Month
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#2D4A3E] text-xs font-mono font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            Monthly Executive AI Retainer • $1,500 / Month
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0D1B2A] tracking-tight leading-[1.15]">
            Your Dedicated Senior AI Strategist &amp; Engineering Team for{" "}
            <span className="text-[#2D4A3E] underline decoration-[#10B981] decoration-4 underline-offset-8">
              $1,500 / Month
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#4A5560] font-normal leading-relaxed max-w-3xl mx-auto">
            Get bi-weekly 1-on-1 strategy sessions, direct async Slack support, monthly stack pruning, and full access to our 100+ prompt library. Continuous AI transformation without hiring a $180k/yr in-house lead.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#enrollment"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-[#2D4A3E] text-[#FBFAF5] font-semibold text-sm hover:bg-[#1A2E26] transition-all shadow-sm hover:shadow"
            >
              Apply for Coaching Retainer ($1,500/mo)
              <ArrowRight className="w-4 h-4 text-[#10B981]" />
            </a>
            <a
              href="#pillars"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-[#F5F4ED] text-[#0D1B2A] border border-[#E5E3D7] font-semibold text-sm hover:bg-[#EBE8DC] transition-all"
            >
              Explore the 4 Retainer Pillars
              <ChevronRight className="w-4 h-4 text-[#2D4A3E]" />
            </a>
          </div>

          {/* Stat Callouts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-left">
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Monthly Retainer</div>
              <div className="text-2xl font-bold font-mono text-[#0D1B2A]">$1,500/mo</div>
              <div className="text-xs text-[#7A8694]">Month-to-month, cancel anytime</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Slack SLA</div>
              <div className="text-2xl font-bold font-mono text-[#10B981]">&lt; 4 Hours</div>
              <div className="text-xs text-[#7A8694]">Direct async dev support</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Live Sessions</div>
              <div className="text-2xl font-bold font-mono text-[#0D1B2A]">2x / Month</div>
              <div className="text-xs text-[#7A8694]">60-min 1-on-1 executive calls</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Prompt Vault</div>
              <div className="text-2xl font-bold font-mono text-[#2D4A3E]">100+ Blueprints</div>
              <div className="text-xs text-[#7A8694]">Updated weekly</div>
            </div>
          </div>
        </section>

        {/* SECTION 1: THE 4 CORE RETAINER PILLARS */}
        <section id="pillars" className="scroll-mt-12 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider bg-[#F5F4ED] px-3 py-1 rounded-full border border-[#E5E3D7]">
              <Layers className="w-3.5 h-3.5 text-[#10B981]" />
              The 4 Pillars of Support
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D1B2A]">
              Comprehensive AI Enablement for Your Operations
            </h2>
            <p className="text-base text-[#4A5560]">
              Everything required to keep your team at the forefront of AI productivity without adding internal engineering headcount.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RETAINER_PILLARS.map((pillar) => {
              const isSelected = pillar.id === selectedPillarId;
              return (
                <div
                  key={pillar.id}
                  onClick={() => setSelectedPillarId(pillar.id)}
                  className={`cursor-pointer rounded-xl border p-6 transition-all space-y-4 flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#FFFFFF] border-[#10B981] shadow-md ring-2 ring-[#10B981]/20"
                      : "bg-[#FFFFFF] border-[#E5E3D7] hover:border-[#2D4A3E]/40"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-[#F5F4ED] border border-[#E5E3D7] flex items-center justify-center text-[#2D4A3E]">
                          {pillar.iconName === "Video" && <Video className="w-5 h-5 text-[#2D4A3E]" />}
                          {pillar.iconName === "MessageSquare" && <MessageSquare className="w-5 h-5 text-[#10B981]" />}
                          {pillar.iconName === "Layers" && <Layers className="w-5 h-5 text-[#2D4A3E]" />}
                          {pillar.iconName === "BookOpen" && <BookOpen className="w-5 h-5 text-[#10B981]" />}
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">{pillar.title}</h3>
                          <span className="text-xs font-mono text-[#10B981] font-semibold">{pillar.subtitle}</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono bg-[#F5F4ED] text-[#4A5560] px-2.5 py-1 rounded border border-[#E5E3D7]">
                        {pillar.cadence}
                      </span>
                    </div>

                    <p className="text-xs text-[#4A5560] leading-relaxed italic">{pillar.valueProp}</p>

                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-mono text-[#0D1B2A] font-bold uppercase tracking-wider">Key Deliverables:</div>
                      <ul className="space-y-1.5">
                        {pillar.deliverables.map((item, idx) => (
                          <li key={idx} className="text-xs text-[#0D1B2A] flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-[#E5E3D7] pt-4 text-xs font-mono text-[#2D4A3E] font-semibold flex items-center justify-between">
                    <span>Pillar {pillar.id === "strategy-sessions" ? "01" : pillar.id === "slack-support" ? "02" : pillar.id === "stack-auditing" ? "03" : "04"} Included in Retainer</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Pillar Preview Panel */}
          <div className="bg-[#0D1B2A] text-[#FBFAF5] rounded-xl p-6 sm:p-8 space-y-4 border border-[#2D4A3E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D4A3E] pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#10B981]" />
                <div>
                  <div className="text-xs font-mono text-[#10B981] uppercase font-semibold">Active Pillar Focus</div>
                  <h3 className="font-serif text-xl font-bold">{activePillar.title}</h3>
                </div>
              </div>
              <span className="text-xs font-mono bg-[#10B981]/20 text-[#10B981] px-3 py-1 rounded font-semibold border border-[#10B981]/30">
                {activePillar.cadence}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#E5E3D7] leading-relaxed">
              {activePillar.valueProp} With our retainer, your leadership team gets direct line access to developers who have built high-scale AI systems across Fortune 500 &amp; high-growth startups.
            </p>
          </div>
        </section>

        {/* SECTION 2: INTERACTIVE ROI & IN-HOUSE VS RETAINER COMPARISON */}
        <section className="bg-[#FFFFFF] border border-[#E5E3D7] rounded-xl p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E3D7] pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider">
                <BadgeDollarSign className="w-4 h-4 text-[#10B981]" />
                Cost vs Capability Analysis
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D1B2A]">
                In-House AI Lead vs. Mad EZ Coaching Retainer
              </h2>
              <p className="text-sm text-[#4A5560]">
                See why forward-thinking companies choose an fractional retainer over hiring a dedicated full-time AI architect.
              </p>
            </div>
            <div className="bg-[#F5F4ED] border border-[#E5E3D7] px-4 py-2 rounded-lg text-xs font-mono text-[#0D1B2A]">
              Annual Savings: <strong className="text-[#10B981]">${netRetainerSavingsPerYear.toLocaleString()} / year</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Comparison Table */}
            <div className="lg:col-span-7 space-y-4">
              <div className="border border-[#E5E3D7] rounded-lg overflow-hidden text-xs">
                <div className="bg-[#F5F4ED] font-mono font-semibold text-[#0D1B2A] grid grid-cols-12 p-3 border-b border-[#E5E3D7]">
                  <div className="col-span-5">Metric / Feature</div>
                  <div className="col-span-3 text-center text-[#7A8694]">Full-Time AI Lead</div>
                  <div className="col-span-4 text-center text-[#10B981] font-bold">Mad EZ Retainer</div>
                </div>

                <div className="divide-y divide-[#E5E3D7] bg-[#FFFFFF]">
                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-semibold text-[#0D1B2A]">Annual Cost</div>
                    <div className="col-span-3 text-center text-[#4A5560] font-mono">$180,000/yr</div>
                    <div className="col-span-4 text-center text-[#10B981] font-mono font-bold">$18,000/yr ($1.5k/mo)</div>
                  </div>

                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-semibold text-[#0D1B2A]">Contract Commitment</div>
                    <div className="col-span-3 text-center text-[#4A5560]">Full-time payroll</div>
                    <div className="col-span-4 text-center text-[#2D4A3E] font-semibold">Month-to-Month</div>
                  </div>

                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-semibold text-[#0D1B2A]">Domain Breadth</div>
                    <div className="col-span-3 text-center text-[#4A5560]">Single person skill</div>
                    <div className="col-span-4 text-center text-[#10B981] font-semibold">Full AI Team Expertise</div>
                  </div>

                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-semibold text-[#0D1B2A]">Async Support SLA</div>
                    <div className="col-span-3 text-center text-[#4A5560]">Subject to PTO/Meetings</div>
                    <div className="col-span-4 text-center text-[#10B981] font-mono font-bold">&lt; 4-Hour Response</div>
                  </div>

                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-semibold text-[#0D1B2A]">Prompt Vault Access</div>
                    <div className="col-span-3 text-center text-[#4A5560]">Built from scratch</div>
                    <div className="col-span-4 text-center text-[#10B981] font-semibold">100+ Battle-Tested Vault</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Calculator side */}
            <div className="lg:col-span-5 bg-[#F5F4ED] border border-[#E5E3D7] rounded-xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#0D1B2A] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#10B981]" />
                  Model Monthly Productivity Yield
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <label htmlFor={roiTeamSliderId} className="text-[#0D1B2A] font-semibold">Supported Team Members:</label>
                    <span className="text-[#2D4A3E] font-bold">{teamSizeForRoi} people</span>
                  </div>
                  <input
                    id={roiTeamSliderId}
                    type="range"
                    min={2}
                    max={50}
                    value={teamSizeForRoi}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTeamSizeForRoi(val);
                      trackRoiCalculatorInteraction(val, val * 16 * 50 * 12);
                    }}
                    className="w-full h-2 bg-[#E5E3D7] rounded-lg appearance-none cursor-pointer accent-[#2D4A3E]"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E5E3D7]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#4A5560]">Est. Recaptured Hours / Mo:</span>
                    <span className="font-mono font-bold text-[#0D1B2A]">{estimatedHoursSavedMonthly} hrs</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#4A5560]">Est. Labor Value / Mo (@ $50/hr):</span>
                    <span className="font-mono font-bold text-[#10B981]">${estimatedMonthlyLaborValuation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-[#E5E3D7]/60">
                    <span className="font-semibold text-[#0D1B2A]">Net Monthly ROI:</span>
                    <span className="font-mono font-bold text-[#2D4A3E]">
                      {Math.round((estimatedMonthlyLaborValuation / 1500) * 10) / 10}x Return
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FFFFFF] p-3 rounded-lg border border-[#E5E3D7] text-[11px] text-[#4A5560]">
                💡 Retainer pays for itself when your team saves just <strong className="text-[#0D1B2A]">30 total hours per month</strong> across all employees.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: MONTHLY 4-WEEK SPRINT CADENCE */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider bg-[#F5F4ED] px-3 py-1 rounded-full border border-[#E5E3D7]">
              <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
              Agile Execution Framework
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D1B2A]">
              How Your Monthly Sprint Cadence Works
            </h2>
            <p className="text-base text-[#4A5560]">
              Every 30 days follow a structured 4-week execution cycle ensuring continuous momentum and measurable output.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WEEKLY_CADENCE.map((step, idx) => (
              <div key={idx} className="bg-[#FFFFFF] border border-[#E5E3D7] rounded-xl p-6 space-y-3 relative hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded">
                    {step.week}
                  </span>
                  <span className="text-[10px] font-mono text-[#7A8694] uppercase">{step.phase}</span>
                </div>
                <h3 className="font-serif font-bold text-base text-[#0D1B2A]">{step.title}</h3>
                <p className="text-xs text-[#4A5560] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: PRICING & COHORT ENROLLMENT CARD */}
        <section id="enrollment" className="scroll-mt-12 space-y-8 max-w-4xl mx-auto">
          <div className="bg-[#0D1B2A] text-[#FBFAF5] border-2 border-[#10B981] rounded-2xl p-8 sm:p-12 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#10B981] text-[#0D1B2A] text-xs font-mono font-bold px-5 py-1.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> 3 Cohort Openings Remaining
            </div>

            <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <div className="inline-block px-3.5 py-1 rounded bg-[#10B981]/20 text-[#10B981] text-xs font-mono font-semibold uppercase">
                  Monthly AI Coaching Retainer
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold">
                  Dedicated AI Operations Partner
                </h2>
                <p className="text-sm text-[#E5E3D7]/80 leading-relaxed max-w-2xl">
                  Transform your operations with ongoing 1-on-1 strategy sessions, async Slack support, stack auditing, and production prompt vaults.
                </p>
              </div>

              <div className="border-y border-[#2D4A3E] py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-5xl font-bold text-[#10B981]">$1,500</span>
                    <span className="text-sm font-mono text-[#E5E3D7]/70">/ month</span>
                  </div>
                  <div className="text-xs text-[#E5E3D7]/70 font-mono">Billed monthly • Cancel anytime • Zero lock-in</div>
                </div>

                <div className="bg-[#1A2A3A] border border-[#2D4A3E] px-4 py-3 rounded-lg text-xs space-y-1">
                  <div className="text-[#10B981] font-mono font-semibold flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" /> Instant Onboarding Access
                  </div>
                  <div className="text-[#E5E3D7]/80">Slack channel created within 2 business hours</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#E5E3D7]">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span><strong>2x 60-Min Strategy Calls / Mo:</strong> Live 1-on-1 executive workflow architectural sessions.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span><strong>Dedicated Async Slack Channel:</strong> Sub-4-hour response SLA for prompt debugging and guidance.</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span><strong>Monthly SaaS Stack Audit:</strong> Continuous pruning of redundant software tools and subscriptions.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span><strong>100+ Production Prompt Vault:</strong> Full access to internal prompt library updated weekly.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  trackCoachingEnrollment();
                  alert("Retainer application submitted. Redirecting to onboarding questionnaire...");
                }}
                className="w-full py-4 rounded-lg bg-[#10B981] text-[#0D1B2A] font-bold text-base hover:bg-[#0EA572] transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                Apply for Coaching Retainer Spot ($1,500/mo)
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="text-xs text-center text-[#E5E3D7]/60 font-mono">
                🔒 Protected by 30-Day Satisfaction Guarantee. Cancel anytime with one click.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider bg-[#F5F4ED] px-3 py-1 rounded-full border border-[#E5E3D7]">
              <HelpCircle className="w-3.5 h-3.5 text-[#10B981]" />
              Common Inquiries
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#0D1B2A]">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {COACHING_FAQS.map((faq, idx) => (
              <div key={idx} className="bg-[#FFFFFF] border border-[#E5E3D7] rounded-lg p-6 space-y-2">
                <h3 className="font-serif text-base font-bold text-[#0D1B2A] flex items-center gap-2">
                  <span className="text-[#10B981] font-mono text-sm">Q:</span>
                  {faq.question}
                </h3>
                <p className="text-xs text-[#4A5560] leading-relaxed pl-5">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#E5E3D7] pt-12 pb-8 text-center space-y-4">
          <div className="text-xs font-mono text-[#7A8694]">
            © {new Date().getFullYear()} Mad EZ AI Operations. Monthly Coaching Retainer. Kami Parchment Design System.
          </div>
        </footer>
      </main>
    </div>
  );
}
