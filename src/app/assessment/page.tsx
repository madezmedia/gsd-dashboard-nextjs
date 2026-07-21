"use client";

import React, { useState, useId } from "react";
import { trackAssessmentBooking, trackRoiCalculatorInteraction } from "@/lib/analytics";
import {
  Calculator,
  Check,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Clock,
  TrendingUp,
  Users,
  Bot,
  FileText,
  Sparkles,
  ArrowRight,
  HelpCircle,
  DollarSign,
  Layers,
  Award,
  Search,
  Video,
  Download,
  ChevronRight,
  Star,
  Sliders,
  RefreshCw,
} from "lucide-react";

// Types
interface ToolBenchmark {
  id: string;
  name: string;
  category: string;
  iconName: string;
  rating: number;
  avgHoursSavedPerWeek: number;
  complexity: "Low" | "Medium" | "High";
  readinessScore: number;
  description: string;
  keyUseCases: string[];
  recommendedTier: "Tier 1 & Tier 2" | "Tier 2 Recommended";
}

const BENCHMARK_TOOLS: ToolBenchmark[] = [
  {
    id: "fathom",
    name: "Fathom AI",
    category: "Meeting Intelligence",
    iconName: "Video",
    rating: 9.6,
    avgHoursSavedPerWeek: 3.5,
    complexity: "Low",
    readinessScore: 98,
    description: "Automated call recording, transcript synthesis, and immediate CRM action-item sync.",
    keyUseCases: ["Executive call summaries", "Auto-push action items to CRM/Notion", "Sales call coaching"],
    recommendedTier: "Tier 1 & Tier 2",
  },
  {
    id: "claude-team",
    name: "Claude Team",
    category: "Strategic AI Engine",
    iconName: "Bot",
    rating: 9.8,
    avgHoursSavedPerWeek: 6.0,
    complexity: "Medium",
    readinessScore: 95,
    description: "Enterprise-grade long-context synthesis, complex document analysis, and coding copilot.",
    keyUseCases: ["100k+ token document reviews", "Strategic plan drafting", "Complex data transformation"],
    recommendedTier: "Tier 1 & Tier 2",
  },
  {
    id: "make",
    name: "Make.com",
    category: "Workflow Automation",
    iconName: "Zap",
    rating: 9.4,
    avgHoursSavedPerWeek: 5.0,
    complexity: "High",
    readinessScore: 90,
    description: "Visual no-code integration platform linking AI models directly with your existing SaaS tools.",
    keyUseCases: ["Multi-app webhook triggers", "Automated lead enrichment", "Cross-platform data sync"],
    recommendedTier: "Tier 2 Recommended",
  },
  {
    id: "perplexity",
    name: "Perplexity Enterprise",
    category: "Real-Time Research",
    iconName: "Search",
    rating: 9.2,
    avgHoursSavedPerWeek: 3.0,
    complexity: "Low",
    readinessScore: 96,
    description: "Fact-checked deep web search engine with live citations and team workspace sharing.",
    keyUseCases: ["Market & competitor intelligence", "Technical verification", "Instant source citations"],
    recommendedTier: "Tier 1 & Tier 2",
  },
  {
    id: "descript",
    name: "Descript",
    category: "Media & Video Production",
    iconName: "FileText",
    rating: 9.0,
    avgHoursSavedPerWeek: 4.0,
    complexity: "Medium",
    readinessScore: 92,
    description: "Transcript-based video and audio editing, voice cloning, and Studio Sound enhancement.",
    keyUseCases: ["Podcast & webinar editing", "Social clip repurposing", "Internal training videos"],
    recommendedTier: "Tier 1 & Tier 2",
  },
  {
    id: "notion-ai",
    name: "Notion AI",
    category: "Knowledge Operations",
    iconName: "Layers",
    rating: 8.9,
    avgHoursSavedPerWeek: 2.5,
    complexity: "Low",
    readinessScore: 94,
    description: "Centralized workspace Q&A search, automatic project status summaries, and team wikis.",
    keyUseCases: ["Company wiki search", "Project status extraction", "Meeting notes to tasks"],
    recommendedTier: "Tier 1 & Tier 2",
  },
  {
    id: "freed-ai",
    name: "Freed AI",
    category: "Specialized Documentation",
    iconName: "Sparkles",
    rating: 9.5,
    avgHoursSavedPerWeek: 5.5,
    complexity: "Medium",
    readinessScore: 91,
    description: "Specialized documentation copilot for structured executive, legal, and operational reporting.",
    keyUseCases: ["Structured clinical/ops reports", "Compliance-ready notes", "Automated intake forms"],
    recommendedTier: "Tier 2 Recommended",
  },
];

const FAQ_ITEMS = [
  {
    question: "What is the turnaround time for the AI Tools Assessment?",
    answer: "Tier 1 Assessments are delivered within 48 hours of completing your 15-minute intake audit. Tier 2 Guided Implementations begin within 24 hours, with your 60-minute strategy call scheduled at your convenience within the first week.",
  },
  {
    question: "How is the $10,400/employee annual labor savings calculated?",
    answer: "Our benchmark assumes a standard 4 hours saved per employee per week through AI automation, valued at an average blended rate of $50/hr ($200/wk x 52 weeks = $10,400/year per employee). In our calculator, you can adjust both employee count and hourly rate to match your team's exact numbers.",
  },
  {
    question: "Do we need an existing technical team to implement these recommendations?",
    answer: "No. Tier 1 delivers a plug-and-play blueprint that any team member can follow. Tier 2 includes hands-on setup where our engineers configure your tools, set up custom prompts, and train your staff directly.",
  },
  {
    question: "What if our team already uses some of these 7 tools?",
    answer: "Most teams use less than 20% of their tools' advanced AI capabilities. Our assessment audits your actual usage, eliminates redundant subscriptions, and builds advanced workflows across your existing stack.",
  },
  {
    question: "What is your 100% ROI Guarantee?",
    answer: "If our audit report fails to identify at least 10x your investment ($4,990 in labor savings for Tier 1, or $12,990 for Tier 2), we will issue a full 100% refund immediately, no questions asked.",
  },
];

export default function AssessmentPage() {
  // Calculator state
  const [employeeCount, setEmployeeCount] = useState<number>(10);
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [weeklyHoursSaved, setWeeklyHoursSaved] = useState<number>(4);
  const [selectedToolId, setSelectedToolId] = useState<string>("fathom");

  const empSliderId = useId();
  const rateSliderId = useId();
  const hoursSliderId = useId();

  // Calculations
  const weeklyHoursCompany = employeeCount * weeklyHoursSaved;
  const annualHoursCompany = weeklyHoursCompany * 52;
  const annualSavingsPerEmp = weeklyHoursSaved * hourlyRate * 52;
  const totalAnnualSavings = employeeCount * annualSavingsPerEmp;

  const tier1Cost = 499;
  const tier2Cost = 1299;

  const tier1RoiMultiplier = Math.round(totalAnnualSavings / tier1Cost);
  const tier2RoiMultiplier = Math.round(totalAnnualSavings / tier2Cost);

  const paybackDaysTier1 = ((tier1Cost / (totalAnnualSavings / 365))).toFixed(1);
  const paybackDaysTier2 = ((tier2Cost / (totalAnnualSavings / 365))).toFixed(1);

  const selectedTool = BENCHMARK_TOOLS.find((t) => t.id === selectedToolId) || BENCHMARK_TOOLS[0];

  return (
    <div className="w-full min-h-screen bg-[#FBFAF5] text-[#0D1B2A] font-sans antialiased selection:bg-[#10B981]/20 selection:text-[#0D1B2A]">
      {/* Top Banner / Trust Header */}
      <header className="border-b border-[#E5E3D7] bg-[#F5F4ED] py-2.5 px-4 sm:px-8 text-xs font-mono tracking-wide text-[#4A5560] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="font-semibold text-[#0D1B2A] uppercase">Mad EZ AI Assessment</span>
          <span className="hidden md:inline text-[#7A8694]">|</span>
          <span className="hidden md:inline">Kami Parchment Benchmark Standard v2.4</span>
        </div>
        <div className="flex items-center gap-4 text-[#2D4A3E] font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 48-Hour Delivery
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> 10x ROI Guarantee
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#2D4A3E] text-xs font-mono font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            AI Stack Audit & Labor Savings Assessment
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0D1B2A] tracking-tight leading-[1.15]">
            Stop Guessing. Audit Your Stack & Unlock{" "}
            <span className="text-[#2D4A3E] underline decoration-[#10B981] decoration-4 underline-offset-8">
              $10,400/Emp Annual Savings
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#4A5560] font-normal leading-relaxed max-w-3xl mx-auto">
            We evaluate your workflows against our <strong className="text-[#0D1B2A] font-semibold">7 Core AI Tools Benchmark</strong>, eliminate SaaS waste, and deliver a zero-fluff, high-ROI action blueprint in <strong className="text-[#0D1B2A] font-semibold">48 hours</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-[#2D4A3E] text-[#FBFAF5] font-semibold text-sm hover:bg-[#1A2E26] transition-all shadow-sm hover:shadow"
            >
              View Tier Pricing ($499 / $1,299)
              <ArrowRight className="w-4 h-4 text-[#10B981]" />
            </a>
            <a
              href="#calculator"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-[#F5F4ED] text-[#0D1B2A] border border-[#E5E3D7] font-semibold text-sm hover:bg-[#EBE8DC] transition-all"
            >
              <Calculator className="w-4 h-4 text-[#2D4A3E]" />
              Calculate Team ROI
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left">
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Avg Annual Savings</div>
              <div className="text-2xl font-bold font-mono text-[#10B981]">$10,400</div>
              <div className="text-xs text-[#7A8694]">Per employee per year</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Evaluated Tools</div>
              <div className="text-2xl font-bold font-mono text-[#0D1B2A]">7 AI Leaders</div>
              <div className="text-xs text-[#7A8694]">Fathom, Claude, Make...</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Delivery Speed</div>
              <div className="text-2xl font-bold font-mono text-[#0D1B2A]">48 Hours</div>
              <div className="text-xs text-[#7A8694]">Guaranteed turnaround</div>
            </div>
            <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E5E3D7] shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#4A5560] uppercase">Min ROI Guarantee</div>
              <div className="text-2xl font-bold font-mono text-[#2D4A3E]">10x Return</div>
              <div className="text-xs text-[#7A8694]">Or 100% money back</div>
            </div>
          </div>
        </section>

        {/* SECTION 1: INTERACTIVE ROI LABOR CALCULATOR */}
        <section id="calculator" className="scroll-mt-12 bg-[#FFFFFF] border border-[#E5E3D7] rounded-xl p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E3D7] pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-[#10B981]" />
                Interactive Labor Savings Model
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D1B2A]">
                Calculate Your Team&apos;s Annual AI Opportunity
              </h2>
              <p className="text-sm text-[#4A5560]">
                Adjust sliders to model how small weekly productivity gains compound across your workforce.
              </p>
            </div>
            <div className="bg-[#F5F4ED] border border-[#E5E3D7] px-4 py-2 rounded-lg text-xs font-mono text-[#4A5560] space-y-0.5">
              <div>Benchmark Baseline: <strong className="text-[#0D1B2A]">4 hrs/emp/wk @ $50/hr</strong></div>
              <div>Standard Unit Value: <strong className="text-[#10B981]">$10,400 / emp / year</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sliders Column */}
            <div className="lg:col-span-6 space-y-6">
              {/* Slider 1: Employee Count */}
              <div className="space-y-3 bg-[#FBFAF5] p-5 rounded-lg border border-[#E5E3D7]">
                <div className="flex items-center justify-between">
                  <label htmlFor={empSliderId} className="text-sm font-semibold text-[#0D1B2A] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#2D4A3E]" />
                    Team Size (Employees)
                  </label>
                  <span className="font-mono text-lg font-bold text-[#2D4A3E] bg-[#FFFFFF] px-3 py-1 rounded border border-[#E5E3D7]">
                    {employeeCount} emp
                  </span>
                </div>
                <input
                  id={empSliderId}
                  type="range"
                  min={1}
                  max={100}
                  value={employeeCount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEmployeeCount(val);
                    trackRoiCalculatorInteraction(val, val * weeklyHoursSaved * hourlyRate * 52);
                  }}
                  className="w-full h-2 bg-[#E5E3D7] rounded-lg appearance-none cursor-pointer accent-[#2D4A3E]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#7A8694]">
                  <span>1 person</span>
                  <span>25 emp</span>
                  <span>50 emp</span>
                  <span>100 emp</span>
                </div>
              </div>

              {/* Slider 2: Average Hourly Rate */}
              <div className="space-y-3 bg-[#FBFAF5] p-5 rounded-lg border border-[#E5E3D7]">
                <div className="flex items-center justify-between">
                  <label htmlFor={rateSliderId} className="text-sm font-semibold text-[#0D1B2A] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#2D4A3E]" />
                    Blended Hourly Labor Rate
                  </label>
                  <span className="font-mono text-lg font-bold text-[#2D4A3E] bg-[#FFFFFF] px-3 py-1 rounded border border-[#E5E3D7]">
                    ${hourlyRate}/hr
                  </span>
                </div>
                <input
                  id={rateSliderId}
                  type="range"
                  min={25}
                  max={150}
                  step={5}
                  value={hourlyRate}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHourlyRate(val);
                    trackRoiCalculatorInteraction(employeeCount, employeeCount * weeklyHoursSaved * val * 52);
                  }}
                  className="w-full h-2 bg-[#E5E3D7] rounded-lg appearance-none cursor-pointer accent-[#2D4A3E]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#7A8694]">
                  <span>$25/hr (Ops)</span>
                  <span>$50/hr (Avg)</span>
                  <span>$100/hr (Sr)</span>
                  <span>$150/hr (Exec)</span>
                </div>
              </div>

              {/* Slider 3: Hours Saved / Week */}
              <div className="space-y-3 bg-[#FBFAF5] p-5 rounded-lg border border-[#E5E3D7]">
                <div className="flex items-center justify-between">
                  <label htmlFor={hoursSliderId} className="text-sm font-semibold text-[#0D1B2A] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2D4A3E]" />
                    Hours Saved per Employee / Week
                  </label>
                  <span className="font-mono text-lg font-bold text-[#10B981] bg-[#FFFFFF] px-3 py-1 rounded border border-[#E5E3D7]">
                    {weeklyHoursSaved} hrs/wk
                  </span>
                </div>
                <input
                  id={hoursSliderId}
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={weeklyHoursSaved}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeeklyHoursSaved(val);
                    trackRoiCalculatorInteraction(employeeCount, employeeCount * val * hourlyRate * 52);
                  }}
                  className="w-full h-2 bg-[#E5E3D7] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#7A8694]">
                  <span>1 hr (Conservative)</span>
                  <span>4 hrs (Baseline)</span>
                  <span>7 hrs (High)</span>
                  <span>10 hrs (Transformational)</span>
                </div>
              </div>
            </div>

            {/* Calculations & Results Display */}
            <div className="lg:col-span-6 bg-[#0D1B2A] text-[#FBFAF5] rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#2D4A3E] pb-3">
                  <span className="font-mono text-xs text-[#10B981] uppercase tracking-wider font-semibold">
                    Calculated Annual ROI
                  </span>
                  <span className="text-xs text-[#E5E3D7]/70 font-mono">Based on {employeeCount} Team Members</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-[#E5E3D7]/80 uppercase font-mono">Total Annual Labor Savings</div>
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-[#10B981]">
                    ${totalAnnualSavings.toLocaleString()}
                    <span className="text-sm font-sans font-normal text-[#E5E3D7]/70"> / year</span>
                  </div>
                  <div className="text-xs text-[#E5E3D7]/70 pt-1">
                    Equates to <strong className="text-[#FBFAF5] font-mono">{annualHoursCompany.toLocaleString()} hours</strong> of recaptured productive capacity per year.
                  </div>
                </div>

                {/* Sub-KPI Grid inside Result Box */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#2D4A3E]/60">
                  <div className="bg-[#1A2A3A] p-3.5 rounded-lg border border-[#2D4A3E]">
                    <div className="text-[11px] font-mono text-[#E5E3D7]/70">Tier 1 Assessment ($499)</div>
                    <div className="text-xl font-bold font-mono text-[#FBFAF5] mt-1">{tier1RoiMultiplier}x ROI</div>
                    <div className="text-[11px] text-[#10B981] mt-0.5">Payback in {paybackDaysTier1} days</div>
                  </div>
                  <div className="bg-[#1A2A3A] p-3.5 rounded-lg border border-[#2D4A3E]">
                    <div className="text-[11px] font-mono text-[#E5E3D7]/70">Tier 2 Guided ($1,299)</div>
                    <div className="text-xl font-bold font-mono text-[#FBFAF5] mt-1">{tier2RoiMultiplier}x ROI</div>
                    <div className="text-[11px] text-[#10B981] mt-0.5">Payback in {paybackDaysTier2} days</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="#pricing"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-[#10B981] text-[#0D1B2A] font-bold text-sm hover:bg-[#0EA572] transition-colors"
                >
                  Lock In Your Audit Rate Now
                  <ArrowRight className="w-4 h-4" />
                </a>
                <p className="text-[11px] text-center text-[#E5E3D7]/60">
                  ⚡ Guaranteed delivery within 48 hours. Zero risk with our 10x ROI money-back guarantee.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE 7 AI TOOLS BENCHMARK GRID */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider bg-[#F5F4ED] px-3 py-1 rounded-full border border-[#E5E3D7]">
              <Layers className="w-3.5 h-3.5 text-[#10B981]" />
              Evaluation Matrix
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D1B2A]">
              The 7 Core AI Tools We Benchmark for Your Business
            </h2>
            <p className="text-base text-[#4A5560]">
              Every assessment systematically audits these seven enterprise-ready platforms against your current manual workflows.
            </p>
          </div>

          {/* 7 Tools Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENCHMARK_TOOLS.map((tool) => {
              const isSelected = tool.id === selectedToolId;
              return (
                <div
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`cursor-pointer rounded-xl border p-6 transition-all relative flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "bg-[#FFFFFF] border-[#10B981] shadow-md ring-2 ring-[#10B981]/20"
                      : "bg-[#FFFFFF] border-[#E5E3D7] hover:border-[#2D4A3E]/40 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F5F4ED] border border-[#E5E3D7] flex items-center justify-center text-[#2D4A3E]">
                          {tool.iconName === "Video" && <Video className="w-5 h-5" />}
                          {tool.iconName === "Bot" && <Bot className="w-5 h-5" />}
                          {tool.iconName === "Zap" && <Zap className="w-5 h-5" />}
                          {tool.iconName === "Search" && <Search className="w-5 h-5" />}
                          {tool.iconName === "FileText" && <FileText className="w-5 h-5" />}
                          {tool.iconName === "Layers" && <Layers className="w-5 h-5" />}
                          {tool.iconName === "Sparkles" && <Sparkles className="w-5 h-5 text-[#10B981]" />}
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#0D1B2A]">{tool.name}</h3>
                          <span className="text-xs font-mono text-[#7A8694]">{tool.category}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#2D4A3E] text-xs font-mono font-bold px-2.5 py-1 rounded">
                        <Star className="w-3 h-3 fill-[#10B981] text-[#10B981]" />
                        {tool.rating}
                      </span>
                    </div>

                    <p className="text-xs text-[#4A5560] leading-relaxed">{tool.description}</p>

                    <div className="space-y-1.5 pt-2">
                      <div className="text-[11px] font-mono text-[#7A8694] uppercase font-semibold">Primary Use Cases</div>
                      <ul className="space-y-1">
                        {tool.keyUseCases.map((uc, i) => (
                          <li key={i} className="text-xs text-[#0D1B2A] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                            <span>{uc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-[#E5E3D7] pt-4 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[#7A8694]">Avg Time Saved: </span>
                      <strong className="text-[#10B981]">{tool.avgHoursSavedPerWeek} hrs/wk</strong>
                    </div>
                    <div className="text-[#4A5560] bg-[#F5F4ED] px-2 py-0.5 rounded text-[10px]">
                      Complexity: {tool.complexity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Dive Panel for Selected Tool */}
          <div className="bg-[#F5F4ED] border border-[#E5E3D7] rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#2D4A3E] text-[#FBFAF5] flex items-center justify-center">
                  <Sliders className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <div className="text-xs font-mono text-[#4A5560] uppercase">Selected Audit Tool Deep-Dive</div>
                  <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">{selectedTool.name} Benchmark Analysis</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#4A5560]">Assessment Target:</span>
                <span className="bg-[#2D4A3E] text-[#FBFAF5] text-xs font-mono px-3 py-1 rounded font-semibold">
                  {selectedTool.recommendedTier}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E3D7]">
                <div className="text-xs text-[#7A8694] font-mono">Readiness Score</div>
                <div className="text-2xl font-bold font-mono text-[#10B981] mt-1">{selectedTool.readinessScore}/100</div>
                <div className="text-xs text-[#4A5560] mt-1">Enterprise compliance & security readiness</div>
              </div>
              <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E3D7]">
                <div className="text-xs text-[#7A8694] font-mono">Average Weekly Impact</div>
                <div className="text-2xl font-bold font-mono text-[#0D1B2A] mt-1">{selectedTool.avgHoursSavedPerWeek} Hours</div>
                <div className="text-xs text-[#4A5560] mt-1">Saved per active team member</div>
              </div>
              <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E3D7]">
                <div className="text-xs text-[#7A8694] font-mono">Implementation Curve</div>
                <div className="text-2xl font-bold font-mono text-[#2D4A3E] mt-1">{selectedTool.complexity} Complexity</div>
                <div className="text-xs text-[#4A5560] mt-1">Plug-and-play vs API setup needed</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRICING COMPARISON CARDS */}
        <section id="pricing" className="scroll-mt-12 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider bg-[#F5F4ED] px-3 py-1 rounded-full border border-[#E5E3D7]">
              <Award className="w-3.5 h-3.5 text-[#10B981]" />
              Transparent 2-Tier Pricing
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0D1B2A]">
              Choose Your AI Tools Assessment Tier
            </h2>
            <p className="text-base text-[#4A5560]">
              Get a complete diagnostic blueprint for $499 or opt for hands-on executive setup for $1,299.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* TIER 1 CARD: $499 */}
            <div className="bg-[#FFFFFF] border border-[#E5E3D7] rounded-2xl p-8 flex flex-col justify-between space-y-8 hover:shadow-md transition-shadow relative">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded bg-[#F5F4ED] text-[#2D4A3E] text-xs font-mono font-semibold uppercase">
                    Tier 1 — Essential Diagnostic
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#0D1B2A]">AI Tools Assessment</h3>
                  <p className="text-xs text-[#4A5560] leading-relaxed">
                    Designed for leaders seeking immediate visibility into workflow bottlenecks, SaaS waste, and exact labor savings opportunities.
                  </p>
                </div>

                <div className="border-y border-[#E5E3D7] py-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl sm:text-5xl font-bold text-[#0D1B2A]">$499</span>
                    <span className="text-xs font-mono text-[#7A8694]">One-time fee</span>
                  </div>
                  <div className="text-xs font-mono text-[#10B981] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Delivered asynchronously in 48 hours
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-[#0D1B2A] uppercase font-bold tracking-wider">What&apos;s Included:</div>
                  <ul className="space-y-2.5 text-xs text-[#0D1B2A]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>7 Core AI Tools Audit:</strong> Comprehensive evaluation of Fathom, Claude, Make, Perplexity, Descript, Notion AI & Freed.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>Custom ROI Labor Model:</strong> Tailored spreadsheet detailing exact $10,400/emp savings across your teams.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>SaaS Stack Pruning Plan:</strong> Identify and eliminate redundant software subscriptions to reduce overhead.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>Executive Blueprint PDF:</strong> Actionable 15-page diagnostic report with prioritized quick-win implementations.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>100% Money-Back Guarantee:</strong> Full refund if report fails to show 10x ROI potential.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    trackAssessmentBooking("Tier 1", "AI Tools Assessment");
                    alert("Tier 1 Assessment selected. Redirecting to checkout...");
                  }}
                  className="w-full py-3.5 rounded-lg bg-[#2D4A3E] text-[#FBFAF5] font-bold text-sm hover:bg-[#1A2E26] transition-colors flex items-center justify-center gap-2"
                >
                  Order $499 Assessment
                  <ChevronRight className="w-4 h-4 text-[#10B981]" />
                </button>
                <div className="text-[11px] text-center text-[#7A8694]">No meetings required • 15-min intake form</div>
              </div>
            </div>

            {/* TIER 2 CARD: $1,299 (MOST POPULAR) */}
            <div className="bg-[#0D1B2A] text-[#FBFAF5] border-2 border-[#10B981] rounded-2xl p-8 flex flex-col justify-between space-y-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#10B981] text-[#0D1B2A] text-[10px] font-mono font-bold px-4 py-1.5 rounded-bl-lg uppercase tracking-wider">
                ★ Most Popular & Best Value
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded bg-[#10B981]/20 text-[#10B981] text-xs font-mono font-semibold uppercase">
                    Tier 2 — Guided Implementation
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#FBFAF5]">Guided Assessment & Setup</h3>
                  <p className="text-xs text-[#E5E3D7]/80 leading-relaxed">
                    For teams ready to audit, configure, and launch their AI stack with direct hands-on executive guidance.
                  </p>
                </div>

                <div className="border-y border-[#2D4A3E] py-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl sm:text-5xl font-bold text-[#10B981]">$1,299</span>
                    <span className="text-xs font-mono text-[#E5E3D7]/70">One-time fee</span>
                  </div>
                  <div className="text-xs font-mono text-[#FBFAF5] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#10B981]" /> Includes 60-Min Live Executive Strategy Call
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-[#10B981] uppercase font-bold tracking-wider">Everything in Tier 1 PLUS:</div>
                  <ul className="space-y-2.5 text-xs text-[#E5E3D7]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>60-Min Strategy Call:</strong> Live 1-on-1 session with senior AI strategist to map workflow deployment.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>Hands-On Tool Configuration:</strong> We assist in configuring workspace settings for Fathom, Claude & Make.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>Custom Prompt Library:</strong> 20+ production-grade prompts engineered specifically for your domain.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>Team Onboarding SOPs:</strong> Standard operating procedures and training video clips for fast team adoption.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span><strong>14-Day Async Support:</strong> Direct Q&A access for your team following strategy call.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    trackAssessmentBooking("Tier 2", "Guided Assessment & Setup");
                    alert("Tier 2 Guided Assessment selected. Redirecting to scheduler...");
                  }}
                  className="w-full py-3.5 rounded-lg bg-[#10B981] text-[#0D1B2A] font-bold text-sm hover:bg-[#0EA572] transition-colors flex items-center justify-center gap-2"
                >
                  Get $1,299 Guided Assessment
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-[11px] text-center text-[#E5E3D7]/60">⚡ Priority scheduling within 48 business hours</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PROCESS & DELIVERABLES */}
        <section className="bg-[#FFFFFF] border border-[#E5E3D7] rounded-xl p-8 sm:p-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D1B2A]">
              How the Assessment Audit Works
            </h2>
            <p className="text-sm text-[#4A5560]">
              From intake to executive delivery in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg bg-[#FBFAF5] border border-[#E5E3D7] space-y-3">
              <div className="w-8 h-8 rounded bg-[#2D4A3E] text-[#10B981] font-mono font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-serif font-bold text-[#0D1B2A]">15-Min Async Intake</h3>
              <p className="text-xs text-[#4A5560] leading-relaxed">
                Submit details about your software stack, team structure, and primary daily friction points via our quick form.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#FBFAF5] border border-[#E5E3D7] space-y-3">
              <div className="w-8 h-8 rounded bg-[#2D4A3E] text-[#10B981] font-mono font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-serif font-bold text-[#0D1B2A]">7-Tool Benchmark Audit</h3>
              <p className="text-xs text-[#4A5560] leading-relaxed">
                Our AI engineers analyze your workflows against Fathom, Claude, Make, and the top tools to find high-impact gaps.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#FBFAF5] border border-[#E5E3D7] space-y-3">
              <div className="w-8 h-8 rounded bg-[#2D4A3E] text-[#10B981] font-mono font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-serif font-bold text-[#0D1B2A]">ROI & Labor Modeling</h3>
              <p className="text-xs text-[#4A5560] leading-relaxed">
                We calculate exact labor recapture potential at $10,400/emp and build your custom ROI spreadsheet model.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#FBFAF5] border border-[#E5E3D7] space-y-3">
              <div className="w-8 h-8 rounded bg-[#2D4A3E] text-[#10B981] font-mono font-bold flex items-center justify-center text-sm">
                04
              </div>
              <h3 className="font-serif font-bold text-[#0D1B2A]">Delivery & Setup Call</h3>
              <p className="text-xs text-[#4A5560] leading-relaxed">
                Receive your 15-page diagnostic blueprint in 48 hours. Tier 2 clients join their 60-min live strategy session.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2D4A3E] uppercase tracking-wider bg-[#F5F4ED] px-3 py-1 rounded-full border border-[#E5E3D7]">
              <HelpCircle className="w-3.5 h-3.5 text-[#10B981]" />
              Got Questions?
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#0D1B2A]">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
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

        {/* FOOTER CALL TO ACTION */}
        <footer className="border-t border-[#E5E3D7] pt-12 pb-8 text-center space-y-6">
          <div className="bg-[#0D1B2A] text-[#FBFAF5] rounded-2xl p-8 sm:p-12 space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Ready to Unlock Your Team&apos;s Full AI Potential?
            </h2>
            <p className="text-sm text-[#E5E3D7]/80 max-w-xl mx-auto">
              Get your comprehensive 7-Tool Assessment delivered in 48 hours with our 100% ROI guarantee.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="#pricing"
                className="px-8 py-3.5 rounded-lg bg-[#10B981] text-[#0D1B2A] font-bold text-sm hover:bg-[#0EA572] transition-colors"
              >
                Choose Assessment Tier
              </a>
            </div>
          </div>
          <div className="text-xs font-mono text-[#7A8694]">
            © {new Date().getFullYear()} Mad EZ AI Operations. All rights reserved. Kami Parchment Design System.
          </div>
        </footer>
      </main>
    </div>
  );
}
