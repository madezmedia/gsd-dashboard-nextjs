"use client";

import React, { useState, useId } from "react";
import { trackAssessmentBooking, trackRoiCalculatorInteraction } from "@/lib/analytics";
import { VideoPosterPreview } from "@/components/remotion/VideoPosterPreview";
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
  ChevronRight,
  Sliders,
  PhoneCall,
  Inbox,
  Calendar,
  Star,
  Table,
} from "lucide-react";

// 7 Leaks Data with Pain-First Trigger-Action Copy
interface WorkflowLeak {
  id: string;
  title: string;
  triggerAction: string;
  category: string;
  iconName: string;
  impactHours: number;
  remedy: string;
  readinessScore: number;
  complexity: "Low" | "Medium" | "High";
}

const WORKFLOW_LEAKS: WorkflowLeak[] = [
  {
    id: "missed-calls",
    title: "Missed Calls",
    triggerAction: "You miss the call, they call the next guy.",
    category: "Lead Capture",
    iconName: "PhoneCall",
    impactHours: 4.0,
    remedy: "Instant AI call answering & immediate SMS callback dispatch.",
    readinessScore: 98,
    complexity: "Low",
  },
  {
    id: "cold-leads",
    title: "Cold Leads",
    triggerAction: "Leads sit in inbox overnight while competitors reply in 60s.",
    category: "Speed-to-Lead",
    iconName: "Inbox",
    impactHours: 5.5,
    remedy: "60-second AI auto-responder & CRM lead routing pipeline.",
    readinessScore: 96,
    complexity: "Low",
  },
  {
    id: "late-quotes",
    title: "Late Quotes",
    triggerAction: "It's 9pm and you're still doing manual quotes and invoices.",
    category: "Sales Operations",
    iconName: "FileText",
    impactHours: 6.0,
    remedy: "Automated instant proposal engine & fast invoice dispatch.",
    readinessScore: 94,
    complexity: "Medium",
  },
  {
    id: "repeat-questions",
    title: "Repeat Questions",
    triggerAction: "Answering the same 5 questions 20 times a day.",
    category: "Support & FAQs",
    iconName: "HelpCircle",
    impactHours: 3.5,
    remedy: "24/7 AI Knowledge Base assistant for instant customer answers.",
    readinessScore: 95,
    complexity: "Low",
  },
  {
    id: "scheduling-ping-pong",
    title: "Scheduling Ping-Pong",
    triggerAction: "6 back-and-forth emails just to pick a 30-min slot.",
    category: "Calendar Management",
    iconName: "Calendar",
    impactHours: 3.0,
    remedy: "Autonomous calendar booking agent with smart buffer rules.",
    readinessScore: 97,
    complexity: "Low",
  },
  {
    id: "no-reviews",
    title: "No Reviews",
    triggerAction: "Happy clients leave without leaving Google reviews.",
    category: "Reputation Engine",
    iconName: "Star",
    impactHours: 2.5,
    remedy: "Post-service automated review request sequence.",
    readinessScore: 92,
    complexity: "Low",
  },
  {
    id: "night-paperwork",
    title: "Night Paperwork",
    triggerAction: "Drowning in spreadsheets after the workday ends.",
    category: "Back-Office Admin",
    iconName: "Table",
    impactHours: 7.0,
    remedy: "End-of-day automated data sync & report generation.",
    readinessScore: 90,
    complexity: "Medium",
  },
];

const FAQ_ITEMS = [
  {
    question: "What is the turnaround time for the 90-Minute White-Glove Audit?",
    answer: "Tier 1 Assessments are completed within 48 hours of your intake submission. Your 90-minute white-glove audit session is scheduled at your convenience within the first week.",
  },
  {
    question: "How does the Private ACMI Fleet Deployment work?",
    answer: "Tier 2 ($4,500) deploys your dedicated Redis context server, provisions 2 Hermes AI agents, configures background crons, and bridges your team's Mattermost or Slack workspace for end-to-end automation.",
  },
  {
    question: "How is the $10,400/employee annual labor savings calculated?",
    answer: "Our benchmark assumes a standard 4 hours saved per employee per week through workflow leak remediation, valued at an average blended rate of $50/hr ($200/wk x 52 weeks = $10,400/year per employee).",
  },
  {
    question: "What is your 5+ Hr/Wk Reclaimed Guarantee?",
    answer: "If our Tier 1 White-Glove Audit fails to identify at least 5 hours per week of reclaimed labor per employee (or $4,990 in verified labor savings for your team), we will issue a 100% immediate refund.",
  },
  {
    question: "Can we start with Step 0 Free Consult before committing to a paid tier?",
    answer: "Absolutely. Step 0 is a complimentary 15-minute discovery session where we map your top operational leaks and confirm AI readiness before you invest a single dollar.",
  },
];

export default function AssessmentPage() {
  // Calculator state
  const [employeeCount, setEmployeeCount] = useState<number>(10);
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [weeklyHoursSaved, setWeeklyHoursSaved] = useState<number>(4);
  const [selectedLeakId, setSelectedLeakId] = useState<string>("missed-calls");

  const empSliderId = useId();
  const rateSliderId = useId();
  const hoursSliderId = useId();

  // Calculations
  const weeklyHoursCompany = employeeCount * weeklyHoursSaved;
  const annualHoursCompany = weeklyHoursCompany * 52;
  const annualSavingsPerEmp = weeklyHoursSaved * hourlyRate * 52;
  const totalAnnualSavings = employeeCount * annualSavingsPerEmp;

  const tier1Cost = 499;
  const tier2Cost = 4500;

  const tier1RoiMultiplier = Math.round(totalAnnualSavings / tier1Cost);
  const tier2RoiMultiplier = Math.round(totalAnnualSavings / tier2Cost);

  const paybackDaysTier1 = ((tier1Cost / (totalAnnualSavings / 365))).toFixed(1);
  const paybackDaysTier2 = ((tier2Cost / (totalAnnualSavings / 365))).toFixed(1);

  const selectedLeak = WORKFLOW_LEAKS.find((l) => l.id === selectedLeakId) || WORKFLOW_LEAKS[0];

  return (
    <div className="w-full min-h-screen bg-[#faf9f5] text-[#2d4a3e] font-sans antialiased selection:bg-[#E5007D]/20 selection:text-[#2d4a3e]">
      {/* Top Banner / Trust Header */}
      <header className="border-b border-[#2d4a3e]/15 bg-[#faf9f5] py-2.5 px-4 sm:px-8 text-xs font-mono tracking-wide text-[#2d4a3e]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00B9F1] animate-pulse" />
          <span className="font-semibold text-[#2d4a3e] uppercase">Mad EZ AI Operations</span>
          <span className="hidden md:inline text-[#2d4a3e]/40">|</span>
          <span className="hidden md:inline text-[#2d4a3e]/70">Forest Visual System v3.0</span>
        </div>
        <div className="flex items-center gap-4 font-medium text-[#2d4a3e]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#00B9F1]" /> 48-Hour Delivery
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E5007D]" /> 5+ Hr/Wk Reclaimed Guarantee
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5007D]/10 border border-[#E5007D]/30 text-[#E5007D] text-xs font-mono font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#E5007D]" />
            AI Operations & Workflow Leak Audit
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2d4a3e] tracking-tight leading-[1.15]">
            Stop Guessing. Audit Your Leaks & Reclaim{" "}
            <span className="text-[#E5007D] underline decoration-[#00B9F1] decoration-4 underline-offset-8">
              $10,400/Emp Annual Savings
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#2d4a3e]/85 font-normal leading-relaxed max-w-3xl mx-auto">
            We evaluate your operation against our <strong className="text-[#2d4a3e] font-semibold">7 Operational Leaks Benchmark</strong>, eliminate SaaS bloat, and deploy high-ROI AI fleets for your business.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-[#2d4a3e] text-[#faf9f5] font-semibold text-sm hover:bg-[#2d4a3e]/90 transition-all shadow-sm hover:shadow"
            >
              View Pricing Tiers
              <ArrowRight className="w-4 h-4 text-[#FCDC00]" />
            </a>
            <a
              href="#calculator"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-md bg-[#faf9f5] text-[#2d4a3e] border border-[#2d4a3e]/30 font-semibold text-sm hover:bg-[#faf9f5]/80 transition-all"
            >
              <Calculator className="w-4 h-4 text-[#00B9F1]" />
              Calculate Labor ROI
            </a>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left">
            <div className="p-4 rounded-lg bg-[#ffffff] border border-[#2d4a3e]/15 shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#2d4a3e]/70 uppercase">Avg Annual Savings</div>
              <div className="text-2xl font-bold font-mono text-[#E5007D]">$10,400</div>
              <div className="text-xs text-[#2d4a3e]/60">Per employee per year</div>
            </div>
            <div className="p-4 rounded-lg bg-[#ffffff] border border-[#2d4a3e]/15 shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#2d4a3e]/70 uppercase">Audited Leaks</div>
              <div className="text-2xl font-bold font-mono text-[#2d4a3e]">7 Core Pain Points</div>
              <div className="text-xs text-[#2d4a3e]/60">Calls, Leads, Quotes...</div>
            </div>
            <div className="p-4 rounded-lg bg-[#ffffff] border border-[#2d4a3e]/15 shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#2d4a3e]/70 uppercase">Audit Delivery</div>
              <div className="text-2xl font-bold font-mono text-[#00B9F1]">48 Hours</div>
              <div className="text-xs text-[#2d4a3e]/60">Fast-track report turn</div>
            </div>
            <div className="p-4 rounded-lg bg-[#ffffff] border border-[#2d4a3e]/15 shadow-xs space-y-1">
              <div className="text-xs font-mono text-[#2d4a3e]/70 uppercase">Reclaimed Guarantee</div>
              <div className="text-2xl font-bold font-mono text-[#2d4a3e]">5+ Hr/Wk Reclaimed</div>
              <div className="text-xs text-[#2d4a3e]/60">Or 100% money back</div>
            </div>
          </div>
        </section>

        {/* SECTION 1: INTERACTIVE ROI LABOR CALCULATOR */}
        <section id="calculator" className="scroll-mt-12 bg-[#ffffff] border border-[#2d4a3e]/15 rounded-xl p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2d4a3e]/15 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2d4a3e] uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-[#00B9F1]" />
                Interactive Labor Savings Model
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2d4a3e]">
                Calculate Your Team&apos;s Annual AI Opportunity
              </h2>
              <p className="text-sm text-[#2d4a3e]/80">
                Adjust sliders to model how small weekly productivity gains compound across your workforce.
              </p>
            </div>
            <div className="bg-[#faf9f5] border border-[#2d4a3e]/15 px-4 py-2 rounded-lg text-xs font-mono text-[#2d4a3e]/80 space-y-0.5">
              <div>Benchmark Baseline: <strong className="text-[#2d4a3e]">4 hrs/emp/wk @ $50/hr</strong></div>
              <div>Standard Unit Value: <strong className="text-[#E5007D]">$10,400 / emp / year</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sliders Column */}
            <div className="lg:col-span-6 space-y-6">
              {/* Slider 1: Employee Count */}
              <div className="space-y-3 bg-[#faf9f5] p-5 rounded-lg border border-[#2d4a3e]/15">
                <div className="flex items-center justify-between">
                  <label htmlFor={empSliderId} className="text-sm font-semibold text-[#2d4a3e] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#00B9F1]" />
                    Team Size (Employees)
                  </label>
                  <span className="font-mono text-lg font-bold text-[#2d4a3e] bg-[#ffffff] px-3 py-1 rounded border border-[#2d4a3e]/15">
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
                  className="w-full h-2 bg-[#2d4a3e]/15 rounded-lg appearance-none cursor-pointer accent-[#2d4a3e]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#2d4a3e]/60">
                  <span>1 person</span>
                  <span>25 emp</span>
                  <span>50 emp</span>
                  <span>100 emp</span>
                </div>
              </div>

              {/* Slider 2: Average Hourly Rate */}
              <div className="space-y-3 bg-[#faf9f5] p-5 rounded-lg border border-[#2d4a3e]/15">
                <div className="flex items-center justify-between">
                  <label htmlFor={rateSliderId} className="text-sm font-semibold text-[#2d4a3e] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#00B9F1]" />
                    Blended Hourly Labor Rate
                  </label>
                  <span className="font-mono text-lg font-bold text-[#2d4a3e] bg-[#ffffff] px-3 py-1 rounded border border-[#2d4a3e]/15">
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
                  className="w-full h-2 bg-[#2d4a3e]/15 rounded-lg appearance-none cursor-pointer accent-[#2d4a3e]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#2d4a3e]/60">
                  <span>$25/hr (Ops)</span>
                  <span>$50/hr (Avg)</span>
                  <span>$100/hr (Sr)</span>
                  <span>$150/hr (Exec)</span>
                </div>
              </div>

              {/* Slider 3: Hours Saved / Week */}
              <div className="space-y-3 bg-[#faf9f5] p-5 rounded-lg border border-[#2d4a3e]/15">
                <div className="flex items-center justify-between">
                  <label htmlFor={hoursSliderId} className="text-sm font-semibold text-[#2d4a3e] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#E5007D]" />
                    Hours Reclaimed per Employee / Week
                  </label>
                  <span className="font-mono text-lg font-bold text-[#E5007D] bg-[#ffffff] px-3 py-1 rounded border border-[#2d4a3e]/15">
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
                  className="w-full h-2 bg-[#2d4a3e]/15 rounded-lg appearance-none cursor-pointer accent-[#E5007D]"
                />
                <div className="flex justify-between text-[11px] font-mono text-[#2d4a3e]/60">
                  <span>1 hr (Conservative)</span>
                  <span>4 hrs (Baseline)</span>
                  <span>7 hrs (High)</span>
                  <span>10 hrs (Transformational)</span>
                </div>
              </div>
            </div>

            {/* Calculations & Results Display */}
            <div className="lg:col-span-6 bg-[#2d4a3e] text-[#faf9f5] rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#faf9f5]/20 pb-3">
                  <span className="font-mono text-xs text-[#FCDC00] uppercase tracking-wider font-semibold">
                    Calculated Annual Labor ROI
                  </span>
                  <span className="text-xs text-[#faf9f5]/80 font-mono">Based on {employeeCount} Team Members</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-[#faf9f5]/80 uppercase font-mono">Total Annual Labor Savings</div>
                  <div className="text-4xl sm:text-5xl font-mono font-bold text-[#FCDC00]">
                    ${totalAnnualSavings.toLocaleString()}
                    <span className="text-sm font-sans font-normal text-[#faf9f5]/80"> / year</span>
                  </div>
                  <div className="text-xs text-[#faf9f5]/80 pt-1">
                    Equates to <strong className="text-[#faf9f5] font-mono">{annualHoursCompany.toLocaleString()} hours</strong> of recaptured productive capacity per year.
                  </div>
                </div>

                {/* Sub-KPI Grid inside Result Box */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#faf9f5]/20">
                  <div className="bg-[#faf9f5]/10 p-3.5 rounded-lg border border-[#faf9f5]/20">
                    <div className="text-[11px] font-mono text-[#faf9f5]/80">Tier 1 Audit ($499)</div>
                    <div className="text-xl font-bold font-mono text-[#FCDC00] mt-1">{tier1RoiMultiplier}x ROI</div>
                    <div className="text-[11px] text-[#00B9F1] mt-0.5">Payback in {paybackDaysTier1} days</div>
                  </div>
                  <div className="bg-[#faf9f5]/10 p-3.5 rounded-lg border border-[#faf9f5]/20">
                    <div className="text-[11px] font-mono text-[#faf9f5]/80">Tier 2 Fleet ($4,500)</div>
                    <div className="text-xl font-bold font-mono text-[#FCDC00] mt-1">{tier2RoiMultiplier}x ROI</div>
                    <div className="text-[11px] text-[#00B9F1] mt-0.5">Payback in {paybackDaysTier2} days</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href="#pricing"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-[#E5007D] text-[#faf9f5] font-bold text-sm hover:bg-[#E5007D]/90 transition-colors"
                >
                  Lock In Your Audit Rate Now
                  <ArrowRight className="w-4 h-4" />
                </a>
                <p className="text-[11px] text-center text-[#faf9f5]/70">
                  Guaranteed delivery within 48 hours. Zero risk with our 5+ hr/wk reclaimed money-back guarantee.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* REMOTION VIDEO MOTION ASSET PREVIEW */}
        <section className="space-y-4">
          <VideoPosterPreview initialVideo="assessment" showSelector={true} />
        </section>

        {/* SECTION 2: THE 7 WORKFLOW LEAKS GRID (PAIN-FIRST TRIGGER-ACTION COPY) */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2d4a3e] uppercase tracking-wider bg-[#faf9f5] px-3 py-1 rounded-full border border-[#2d4a3e]/15">
              <Layers className="w-3.5 h-3.5 text-[#E5007D]" />
              7 Operational Leaks Matrix
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d4a3e]">
              The 7 Operational Leaks Draining Your Business
            </h2>
            <p className="text-base text-[#2d4a3e]/80">
              Pain-first diagnostic matrix identifying where hours and revenue slip through the cracks.
            </p>
          </div>

          {/* 7 Leaks Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKFLOW_LEAKS.map((leak) => {
              const isSelected = leak.id === selectedLeakId;
              return (
                <div
                  key={leak.id}
                  onClick={() => setSelectedLeakId(leak.id)}
                  className={`cursor-pointer rounded-xl border p-6 transition-all relative flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? "bg-[#ffffff] border-[#E5007D] shadow-md ring-2 ring-[#E5007D]/20"
                      : "bg-[#ffffff] border-[#2d4a3e]/15 hover:border-[#2d4a3e]/40 hover:shadow-xs"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#faf9f5] border border-[#2d4a3e]/15 flex items-center justify-center text-[#2d4a3e]">
                          {leak.iconName === "PhoneCall" && <PhoneCall className="w-5 h-5 text-[#E5007D]" />}
                          {leak.iconName === "Inbox" && <Inbox className="w-5 h-5 text-[#00B9F1]" />}
                          {leak.iconName === "FileText" && <FileText className="w-5 h-5 text-[#2d4a3e]" />}
                          {leak.iconName === "HelpCircle" && <HelpCircle className="w-5 h-5 text-[#00B9F1]" />}
                          {leak.iconName === "Calendar" && <Calendar className="w-5 h-5 text-[#E5007D]" />}
                          {leak.iconName === "Star" && <Star className="w-5 h-5 text-[#FCDC00]" />}
                          {leak.iconName === "Table" && <Table className="w-5 h-5 text-[#2d4a3e]" />}
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#2d4a3e]">{leak.title}</h3>
                          <span className="text-xs font-mono text-[#2d4a3e]/60">{leak.category}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-[#E5007D]/10 text-[#E5007D] text-xs font-mono font-bold px-2.5 py-1 rounded">
                        Leak #{WORKFLOW_LEAKS.findIndex((l) => l.id === leak.id) + 1}
                      </span>
                    </div>

                    {/* Trigger-Action Pain Copy */}
                    <div className="bg-[#faf9f5] p-3 rounded-lg border border-[#2d4a3e]/10">
                      <div className="text-[11px] font-mono text-[#E5007D] uppercase font-bold">Pain Trigger:</div>
                      <p className="text-xs text-[#2d4a3e] font-medium leading-relaxed mt-0.5">
                        &quot;{leak.triggerAction}&quot;
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-mono text-[#2d4a3e]/70 uppercase font-semibold">AI Remedy</div>
                      <div className="text-xs text-[#2d4a3e] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00B9F1] shrink-0" />
                        <span>{leak.remedy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#2d4a3e]/15 pt-4 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[#2d4a3e]/70">Impact: </span>
                      <strong className="text-[#E5007D]">{leak.impactHours} hrs/wk</strong>
                    </div>
                    <div className="text-[#2d4a3e] bg-[#faf9f5] px-2 py-0.5 rounded text-[10px] border border-[#2d4a3e]/10">
                      Complexity: {leak.complexity}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Dive Panel for Selected Leak */}
          <div className="bg-[#faf9f5] border border-[#2d4a3e]/15 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#2d4a3e] text-[#faf9f5] flex items-center justify-center">
                  <Sliders className="w-6 h-6 text-[#00B9F1]" />
                </div>
                <div>
                  <div className="text-xs font-mono text-[#2d4a3e]/70 uppercase">Selected Leak Diagnostic</div>
                  <h3 className="font-serif text-xl font-bold text-[#2d4a3e]">{selectedLeak.title} Pain & Remedy Analysis</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#2d4a3e]/70">Leak Remediation:</span>
                <span className="bg-[#2d4a3e] text-[#faf9f5] text-xs font-mono px-3 py-1 rounded font-semibold">
                  Audited in Tier 1 & Tier 2
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#ffffff] p-4 rounded-lg border border-[#2d4a3e]/15">
                <div className="text-xs text-[#2d4a3e]/70 font-mono">Trigger Pain Point</div>
                <div className="text-sm font-bold text-[#E5007D] mt-1">&quot;{selectedLeak.triggerAction}&quot;</div>
                <div className="text-xs text-[#2d4a3e]/60 mt-1">Primary operational friction point</div>
              </div>
              <div className="bg-[#ffffff] p-4 rounded-lg border border-[#2d4a3e]/15">
                <div className="text-xs text-[#2d4a3e]/70 font-mono">Average Weekly Impact</div>
                <div className="text-2xl font-bold font-mono text-[#2d4a3e] mt-1">{selectedLeak.impactHours} Hours</div>
                <div className="text-xs text-[#2d4a3e]/60 mt-1">Lost per week per employee</div>
              </div>
              <div className="bg-[#ffffff] p-4 rounded-lg border border-[#2d4a3e]/15">
                <div className="text-xs text-[#2d4a3e]/70 font-mono">Automated Fix</div>
                <div className="text-xs font-bold text-[#2d4a3e] mt-1">{selectedLeak.remedy}</div>
                <div className="text-xs text-[#2d4a3e]/60 mt-1">Turnkey AI deployment solution</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PRICING COMPARISON CARDS (STEP 0, TIER 1, TIER 2) */}
        <section id="pricing" className="scroll-mt-12 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2d4a3e] uppercase tracking-wider bg-[#faf9f5] px-3 py-1 rounded-full border border-[#2d4a3e]/15">
              <Award className="w-3.5 h-3.5 text-[#00B9F1]" />
              Structured 3-Step Pricing Model
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d4a3e]">
              Choose Your AI Audit & Deployment Path
            </h2>
            <p className="text-base text-[#2d4a3e]/80">
              Start with a free consult, get a white-glove audit, or deploy a dedicated autonomous ACMI fleet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* STEP 0 CARD: FREE CONSULT */}
            <div className="bg-[#ffffff] border border-[#2d4a3e]/15 rounded-2xl p-7 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow relative">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded bg-[#faf9f5] text-[#2d4a3e] text-xs font-mono font-semibold uppercase border border-[#2d4a3e]/15">
                    Step 0 — Discovery
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#2d4a3e]">Free 15-Minute Consult</h3>
                  <p className="text-xs text-[#2d4a3e]/80 leading-relaxed">
                    Complimentary 1-on-1 discovery call to map your current workflow leaks and evaluate AI readiness with zero risk.
                  </p>
                </div>

                <div className="border-y border-[#2d4a3e]/15 py-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold text-[#2d4a3e]">$0</span>
                    <span className="text-xs font-mono text-[#2d4a3e]/60">Free consult</span>
                  </div>
                  <div className="text-xs font-mono text-[#00B9F1] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 15-Minute Live Zoom Session
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-[#2d4a3e] uppercase font-bold tracking-wider">What&apos;s Included:</div>
                  <ul className="space-y-2.5 text-xs text-[#2d4a3e]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#00B9F1] shrink-0 mt-0.5" />
                      <span><strong>1-on-1 Discovery Call:</strong> Review your primary operational friction points with an AI specialist.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#00B9F1] shrink-0 mt-0.5" />
                      <span><strong>Workflow Leak Mapping:</strong> Pinpoint which of the 7 core leaks are costing your team the most hours.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#00B9F1] shrink-0 mt-0.5" />
                      <span><strong>Custom Tier Recommendation:</strong> Clear outline of whether Tier 1 Audit or Tier 2 Fleet fits your scale.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    trackAssessmentBooking("Step 0", "Free 15-Minute Consult");
                    alert("Redirecting to Discovery Call scheduler...");
                  }}
                  className="w-full py-3.5 rounded-lg bg-[#faf9f5] text-[#2d4a3e] border border-[#2d4a3e] font-bold text-sm hover:bg-[#2d4a3e]/10 transition-colors flex items-center justify-center gap-2"
                >
                  Book Discovery Call
                  <ChevronRight className="w-4 h-4 text-[#00B9F1]" />
                </button>
                <div className="text-[11px] text-center text-[#2d4a3e]/60">Zero obligation • Instant calendar booking</div>
              </div>
            </div>

            {/* TIER 1 CARD: $499 */}
            <div className="bg-[#ffffff] border-2 border-[#2d4a3e] rounded-2xl p-7 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow relative">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded bg-[#2d4a3e] text-[#faf9f5] text-xs font-mono font-semibold uppercase">
                    Tier 1 — Essential Audit
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#2d4a3e]">90-Min White-Glove Audit</h3>
                  <p className="text-xs text-[#2d4a3e]/80 leading-relaxed">
                    Detailed audit, ROI labor modeling, SaaS pruning plan, and guaranteed 5+ hr/wk reclaimed per employee.
                  </p>
                </div>

                <div className="border-y border-[#2d4a3e]/15 py-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold text-[#2d4a3e]">$499</span>
                    <span className="text-xs font-mono text-[#2d4a3e]/60">One-time fee</span>
                  </div>
                  <div className="text-xs font-mono text-[#E5007D] font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Delivered in 48 hours + 90-min session
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-[#2d4a3e] uppercase font-bold tracking-wider">What&apos;s Included:</div>
                  <ul className="space-y-2.5 text-xs text-[#2d4a3e]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#E5007D] shrink-0 mt-0.5" />
                      <span><strong>90-Minute Audit Session:</strong> Deep-dive review of software stack and daily staff workflows.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#E5007D] shrink-0 mt-0.5" />
                      <span><strong>Custom ROI Labor Model:</strong> Tailored spreadsheet detailing exact $10,400/emp annual labor recapture.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#E5007D] shrink-0 mt-0.5" />
                      <span><strong>SaaS Stack Pruning Plan:</strong> Identify and eliminate redundant subscriptions to slice monthly bill.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#E5007D] shrink-0 mt-0.5" />
                      <span><strong>5+ Hr/Wk Reclaimed Guarantee:</strong> Full money-back guarantee if report fails to show 5+ hrs/wk saved per employee.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    trackAssessmentBooking("Tier 1", "90-Minute White-Glove AI Tools Audit");
                    alert("Tier 1 Audit selected. Redirecting to checkout...");
                  }}
                  className="w-full py-3.5 rounded-lg bg-[#2d4a3e] text-[#faf9f5] font-bold text-sm hover:bg-[#2d4a3e]/90 transition-colors flex items-center justify-center gap-2"
                >
                  Order $499 Audit
                  <ChevronRight className="w-4 h-4 text-[#FCDC00]" />
                </button>
                <div className="text-[11px] text-center text-[#2d4a3e]/60">48-hour blueprint turn • 100% Guarantee</div>
              </div>
            </div>

            {/* TIER 2 CARD: $4,500 (ENTERPRISE FLEET) */}
            <div className="bg-[#2d4a3e] text-[#faf9f5] border-2 border-[#E5007D] rounded-2xl p-7 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#E5007D] text-[#faf9f5] text-[10px] font-mono font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Full Enterprise Fleet
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-block px-3 py-1 rounded bg-[#E5007D]/20 text-[#E5007D] text-xs font-mono font-semibold uppercase">
                    Tier 2 — Private Deployment
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#faf9f5]">Private ACMI Fleet Deployment</h3>
                  <p className="text-xs text-[#faf9f5]/80 leading-relaxed">
                    Turnkey deployment of a private autonomous agent fleet integrated directly with your infrastructure.
                  </p>
                </div>

                <div className="border-y border-[#faf9f5]/20 py-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold text-[#FCDC00]">$4,500</span>
                    <span className="text-xs font-mono text-[#faf9f5]/70">One-time setup</span>
                  </div>
                  <div className="text-xs font-mono text-[#00B9F1] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#FCDC00]" /> Includes Dedicated ACMI Infrastructure
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-[#FCDC00] uppercase font-bold tracking-wider">Fleet Features:</div>
                  <ul className="space-y-2.5 text-xs text-[#faf9f5]/90">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#FCDC00] shrink-0 mt-0.5" />
                      <span><strong>Dedicated Redis Server:</strong> Private high-speed state persistence & conversation memory storage.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#FCDC00] shrink-0 mt-0.5" />
                      <span><strong>2 Custom Hermes Agents:</strong> Autonomous AI agents customized for your lead & ops workflows.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#FCDC00] shrink-0 mt-0.5" />
                      <span><strong>Background Crons & Automation:</strong> Scheduled execution runners for automated periodic tasks.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#FCDC00] shrink-0 mt-0.5" />
                      <span><strong>Mattermost Bridge:</strong> Real-time messaging integration connecting agents with your team chat.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    trackAssessmentBooking("Tier 2", "Private ACMI Fleet Deployment");
                    alert("Tier 2 Fleet Deployment selected. Redirecting to onboarding...");
                  }}
                  className="w-full py-3.5 rounded-lg bg-[#E5007D] text-[#faf9f5] font-bold text-sm hover:bg-[#E5007D]/90 transition-colors flex items-center justify-center gap-2"
                >
                  Deploy $4,500 Fleet
                  <ArrowRight className="w-4 h-4 text-[#FCDC00]" />
                </button>
                <div className="text-[11px] text-center text-[#faf9f5]/70">Priority deployment within 5 business days</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PROCESS & DELIVERABLES */}
        <section className="bg-[#ffffff] border border-[#2d4a3e]/15 rounded-xl p-8 sm:p-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2d4a3e]">
              How the Audit & Fleet Deployment Works
            </h2>
            <p className="text-sm text-[#2d4a3e]/80">
              From discovery to private fleet deployment in four structured steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg bg-[#faf9f5] border border-[#2d4a3e]/15 space-y-3">
              <div className="w-8 h-8 rounded bg-[#2d4a3e] text-[#FCDC00] font-mono font-bold flex items-center justify-center text-sm">
                00
              </div>
              <h3 className="font-serif font-bold text-[#2d4a3e]">Free Consult</h3>
              <p className="text-xs text-[#2d4a3e]/80 leading-relaxed">
                Book a 15-minute discovery session to identify your top operational leaks and map AI goals.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#faf9f5] border border-[#2d4a3e]/15 space-y-3">
              <div className="w-8 h-8 rounded bg-[#2d4a3e] text-[#FCDC00] font-mono font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-serif font-bold text-[#2d4a3e]">90-Min White-Glove Audit</h3>
              <p className="text-xs text-[#2d4a3e]/80 leading-relaxed">
                We audit software usage, eliminate redundant SaaS tools, and quantify $10,400/emp savings.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#faf9f5] border border-[#2d4a3e]/15 space-y-3">
              <div className="w-8 h-8 rounded bg-[#2d4a3e] text-[#FCDC00] font-mono font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-serif font-bold text-[#2d4a3e]">ROI & SaaS Pruning Plan</h3>
              <p className="text-xs text-[#2d4a3e]/80 leading-relaxed">
                Receive your diagnostic blueprint PDF with clear 5+ hr/wk reclaimed labor guarantees.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-[#faf9f5] border border-[#2d4a3e]/15 space-y-3">
              <div className="w-8 h-8 rounded bg-[#2d4a3e] text-[#FCDC00] font-mono font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-serif font-bold text-[#2d4a3e]">Private ACMI Fleet</h3>
              <p className="text-xs text-[#2d4a3e]/80 leading-relaxed">
                Deploy dedicated Redis, Hermes agents, background crons, and Mattermost bridge integrations.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS */}
        <section className="space-y-6 max-w-4xl mx-auto">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2d4a3e] uppercase tracking-wider bg-[#faf9f5] px-3 py-1 rounded-full border border-[#2d4a3e]/15">
              <HelpCircle className="w-3.5 h-3.5 text-[#00B9F1]" />
              Got Questions?
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#2d4a3e]">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div key={idx} className="bg-[#ffffff] border border-[#2d4a3e]/15 rounded-lg p-6 space-y-2">
                <h3 className="font-serif text-base font-bold text-[#2d4a3e] flex items-center gap-2">
                  <span className="text-[#E5007D] font-mono text-sm">Q:</span>
                  {faq.question}
                </h3>
                <p className="text-xs text-[#2d4a3e]/80 leading-relaxed pl-5">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER CALL TO ACTION */}
        <footer className="border-t border-[#2d4a3e]/15 pt-12 pb-8 text-center space-y-6">
          <div className="bg-[#2d4a3e] text-[#faf9f5] rounded-2xl p-8 sm:p-12 space-y-6">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Ready to Eliminate Workflow Leaks & Deploy Your AI Fleet?
            </h2>
            <p className="text-sm text-[#faf9f5]/80 max-w-xl mx-auto">
              Start with a Step 0 Free Consult or order your 90-Minute White-Glove Audit with a 5+ hr/wk reclaimed guarantee.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="#pricing"
                className="px-8 py-3.5 rounded-lg bg-[#E5007D] text-[#faf9f5] font-bold text-sm hover:bg-[#E5007D]/90 transition-colors"
              >
                Choose Pricing Tier
              </a>
            </div>
          </div>
          <div className="text-xs font-mono text-[#2d4a3e]/60">
            © {new Date().getFullYear()} Mad EZ AI Operations. All rights reserved. Forest Visual System.
          </div>
        </footer>
      </main>
    </div>
  );
}
