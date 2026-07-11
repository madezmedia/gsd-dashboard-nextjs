"use client";

import React, { useState, useEffect } from "react";
import { 
  Home, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ChevronUp, 
  Sparkles,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GALLERY_IMAGES = [
  { src: "https://lh3.googleusercontent.com/d/1cCG8ILD1ZZ6CNbsEUR-ZGnciWICPqbUr", alt: "Aerial view of property" },
  { src: "https://lh3.googleusercontent.com/d/1ttuk1flIVE4jSRKpSdDfYlX1wWazB9L4", alt: "Modern kitchen area" },
  { src: "https://lh3.googleusercontent.com/d/1eHKTgqkAw-jns3ZjRIIee11iPHiaDv4z", alt: "Pergola and backyard drone perspective" },
  { src: "https://lh3.googleusercontent.com/d/1qNcwoMjB2fbirFVqWam1RmlJhW0No87D", alt: "Dining space and natural lighting" },
  { src: "https://lh3.googleusercontent.com/d/1BvKgth5_6Xe3XAtRxXqN6DZ4Y5LHAp0v", alt: "Living room layout" },
  { src: "https://lh3.googleusercontent.com/d/1jiqocq5SFe-eIvoFNU49kpQz8Vsp70FZ", alt: "Aerial view of community context" },
  { src: "https://lh3.googleusercontent.com/d/1ndD-OtWw9TJNUcx3_99I3LIJTT0rx9BB", alt: "Upper floor landing / flex area" },
  { src: "https://lh3.googleusercontent.com/d/1iswu_ae4JHJ_sgA35jTB6bToHzr1kI-U", alt: "High altitude community overview" },
  { src: "https://lh3.googleusercontent.com/d/1GTjo5hgmQqgtbpMRX-oJTy1EuYFnBbw6", alt: "Primary suite bedroom view" },
  { src: "https://lh3.googleusercontent.com/d/1kJ2lVF-9eOYbA2CzxABlFFF71krrcniw", alt: "Drone overview of backyard and pergola" },
  { src: "https://lh3.googleusercontent.com/d/1655RQQ37yD1qFxVGc-P8giP7Mep3MtHi", alt: "Neighborhood green space perspective" },
  { src: "https://lh3.googleusercontent.com/d/1Dg-TOojOHKQuQV8XippZPCIEbyxYgH6w", alt: "Master bathroom details" },
  { src: "https://lh3.googleusercontent.com/d/1x3XYbP8is4xYs6tjd6YSNXBdFq15rUYY", alt: "Aerial context of property lot boundary" },
  { src: "https://lh3.googleusercontent.com/d/10Fva-o7vDoyzT3gSjqQyXchmAGBJh8PS", alt: "Secondary bedroom layout" },
  { src: "https://lh3.googleusercontent.com/d/1TtoI-exDoTqWLOBzDXjWFfsmOJS3_MG6", alt: "Beautiful community pool area" },
  { src: "https://lh3.googleusercontent.com/d/15uphlZjrQIZ08SS2Uls5HI78VsWouvtN", alt: "Backyard and playground drone view" },
  { src: "https://lh3.googleusercontent.com/d/190g_7d_Q0nyS3GjqBiyBrwhCHRGrslcF", alt: "Twilight front exterior view" },
  { src: "https://lh3.googleusercontent.com/d/1ZoA-GECeAbjJ2SKuf9lO04D6BR4466pO", alt: "Spacious walk-in closet detail" }
];

export default function SuzanneShowcase() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenLightbox = (index: number) => {
    setActiveImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const handleNavigateLightbox = (direction: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIndex = (activeImageIndex + direction + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
    setActiveImageIndex(nextIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") handleCloseLightbox();
      if (e.key === "ArrowLeft") setActiveImageIndex((prev) => (prev - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length);
      if (e.key === "ArrowRight") setActiveImageIndex((prev) => (prev + 1) % GALLERY_IMAGES.length);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2d4a3e] font-sans selection:bg-[#c4903a] selection:text-white pb-16">
      
      {/* Top Bar Sticky Nav */}
      <header className="sticky top-0 z-40 bg-[#faf8f5]/95 backdrop-blur-md border-b border-[#2d4a3e]/10 py-3.5 px-6 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-[#c4903a]" />
          <span className="font-serif font-bold text-base tracking-tight text-[#2d4a3e]">
            7803 Paper Birch Dr
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-wider">
          <button onClick={() => scrollToSection("about")} className="hover:text-[#c4903a] transition-colors cursor-pointer bg-transparent border-0">About</button>
          <button onClick={() => scrollToSection("reasons")} className="hover:text-[#c4903a] transition-colors cursor-pointer bg-transparent border-0">Why Love It</button>
          <button onClick={() => scrollToSection("gallery")} className="hover:text-[#c4903a] transition-colors cursor-pointer bg-transparent border-0">Photos</button>
          <button onClick={() => scrollToSection("compare")} className="hover:text-[#c4903a] transition-colors cursor-pointer bg-transparent border-0">Compare</button>
          <button onClick={() => scrollToSection("tour")} className="hover:text-[#c4903a] transition-colors cursor-pointer bg-transparent border-0">Video</button>
          <button onClick={() => scrollToSection("location")} className="hover:text-[#c4903a] transition-colors cursor-pointer bg-transparent border-0">Map</button>
        </nav>
        <div>
          <a href="tel:+17048190620">
            <Button size="sm" className="bg-[#2d4a3e] text-white hover:bg-[#1f352c] font-mono text-[10px] uppercase tracking-widest px-4 cursor-pointer">
              Call Agent
            </Button>
          </a>
        </div>
      </header>

      {/* Hero Showcase */}
      <section className="relative h-[80vh] flex items-end justify-start overflow-hidden bg-black text-white">
        <img 
          className="absolute inset-0 w-full h-full object-cover opacity-85 transition-transform duration-1000 hover:scale-105"
          src="https://lh3.googleusercontent.com/d/15056kRDFmbrIG13ovv8Tp5QdCXuOnfYw"
          alt="7803 Paper Birch Dr — Twilight Exterior"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        
        <div className="relative z-10 p-6 md:p-12 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e96840]/90 border border-[#e96840]/30 rounded-none text-xs font-mono font-bold tracking-wider uppercase shadow-md animate-pulse">
            <Sparkles className="h-3.5 w-3.5" /> Just Reduced — $364,900
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-light leading-tight tracking-tight">
            Where Every Day Feels<br />Like the <span className="font-semibold italic text-[#eaf7f7]">Weekend</span>
          </h1>
          <p className="text-sm md:text-lg text-white/80 max-w-2xl font-light leading-relaxed font-sans">
            Move-In Ready Home with a Private Backyard Retreat, Pergola, Stone Fire Pit &amp; Walkable Community Amenities.
          </p>
          <p className="text-xs text-white/60 font-mono uppercase tracking-widest pt-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#c4903a]" /> 7803 Paper Birch Dr — Charlotte, NC 28215
          </p>
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-none text-xs border border-white/10">
              🏡 Listed by <strong>Suzanne Shaw</strong>, LPT Realty LLC
            </span>
            <span className="text-[10px] font-mono text-white/50 bg-black/40 px-2.5 py-1">
              MLS #4395312
            </span>
          </div>
        </div>
      </section>

      {/* Banners Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-y border-[#2d4a3e]/10 text-xs font-mono text-center">
        <div className="bg-[#2d4a3e] text-[#faf9f5] py-4 px-6 flex items-center justify-center gap-2">
          <span>🏡</span>
          <strong>Open House This Weekend:</strong>
          <span>Sat 10:00–1:00 &middot; Sun 11:00–2:00</span>
        </div>
        <div className="bg-[#e96840] text-white py-4 px-6 flex items-center justify-center gap-2">
          <span>💰</span>
          <strong>Seller Incentive:</strong>
          <span>Offering Up To $5,000 Toward Closing Costs!</span>
        </div>
      </div>

      {/* Property Intro */}
      <section id="about" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Main Copy */}
          <div className="lg:col-span-2 space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-[#c4903a] font-bold block">[WELCOME HOME]</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#2d4a3e]">
              A Private Oasis Meticulously Maintained
            </h2>
            <p className="text-base text-[#2d4a3e]/80 leading-relaxed font-light font-sans">
              Some homes check the boxes. This one creates memories. Picture yourself starting your mornings with coffee in the sunshine under your private <strong>pergola</strong>, evenings gathered around the custom <strong>fire pit</strong> with family and friends in the fully fenced backyard, and weekends spent just a short walk from the community <strong>pool, clubhouse, and playground</strong>.
            </p>
            <p className="text-base text-[#2d4a3e]/80 leading-relaxed font-light font-sans">
              Beautifully maintained and move-in ready, this 2017 home offers an <strong>open-concept design</strong> with luxury vinyl plank flooring throughout the main living areas. The bright kitchen features abundant cabinetry, <strong>granite countertops</strong>, generous workspace, and includes the refrigerator. The <strong>primary bedroom suite</strong> is located on the upper floor, alongside a spacious attached <strong>2-car garage</strong>.
            </p>
            <div className="border-t border-[#2d4a3e]/15 pt-6 flex items-center justify-between text-xs text-[#2d4a3e]/50 font-mono">
              <span>MLS #4395312 &middot; CanopyMLS</span>
              <span>Listed by Suzanne Shaw, LPT Realty LLC</span>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="bg-[#f4f2eb] border border-[#2d4a3e]/10 p-8 space-y-6">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[#2d4a3e] font-extrabold pb-3 border-b border-[#2d4a3e]/15">
              [PROPERTY SPECS]
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#2d4a3e]/60 uppercase">Bedrooms</span>
                <p className="text-2xl font-serif font-bold text-[#2d4a3e]">3 Beds</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#2d4a3e]/60 uppercase">Bathrooms</span>
                <p className="text-2xl font-serif font-bold text-[#2d4a3e]">2.5 Baths</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#2d4a3e]/60 uppercase">Square Footage</span>
                <p className="text-2xl font-serif font-bold text-[#2d4a3e]">1,782 sqft</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#2d4a3e]/60 uppercase">Year Built</span>
                <p className="text-2xl font-serif font-bold text-[#2d4a3e]">2017</p>
              </div>
            </div>

            <div className="border-t border-[#2d4a3e]/15 pt-6 space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#2d4a3e]/60">HOA FEE</span>
                <span className="font-bold text-[#2d4a3e]">$47/mo</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#2d4a3e]/60">COMMUNITY</span>
                <span className="font-bold text-[#2d4a3e]">Silverwood</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#2d4a3e]/60">GARAGE</span>
                <span className="font-bold text-[#2d4a3e]">2-Car Attached</span>
              </div>
            </div>

            <div className="pt-2">
              <a href="mailto:suesellscarolinas@gmail.com?subject=Inquiry on 7803 Paper Birch Dr">
                <Button className="w-full bg-[#c4903a] hover:bg-[#b07f2e] text-white font-mono text-xs uppercase py-5 cursor-pointer">
                  Request Information
                </Button>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* Top 10 Reasons */}
      <section id="reasons" className="bg-[#f4f2eb] py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#c4903a] font-bold block">[WHY YOU&apos;LL FALL IN LOVE]</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#2d4a3e]">Top 10 Reasons to Love This Home</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { num: 1, title: "Private Backyard Retreat", desc: "Fully fenced, beautifully landscaped — the perfect space for kids, pets, and weekend gatherings around the fire pit." },
              { num: 2, title: "Custom Pergola & Fire Pit", desc: "Your private oasis awaits. Morning coffee under the pergola, s'mores by the fire at night — everyday feels like a getaway." },
              { num: 3, title: "Move-In Ready Condition", desc: "Freshly updated with luxury vinyl plank floors, modern fixtures, and a bright open-concept layout. Just bring your furniture." },
              { num: 4, title: "Granite Kitchen with Included Appliances", desc: "Spacious kitchen with granite counters, abundant cabinetry, and the refrigerator stays — a true chef's delight." },
              { num: 5, title: "Low $47/Month HOA", desc: "Unbeatable value. Covers the community pool, clubhouse, and playground — just a short walk from your front door." },
              { num: 6, title: "Primary Suite Upstairs", desc: "A spacious primary bedroom with en-suite bath and walk-in closet — your private retreat within a retreat." },
              { num: 7, title: "Attached 2-Car Garage", desc: "Plenty of room for vehicles, storage, and hobbies. Front-facing access with additional driveway parking." },
              { num: 8, title: "Sought-After Silverwood Community", desc: "A welcoming neighborhood with tree-lined streets, walking paths, and a true sense of community in northeast Charlotte." },
              { num: 9, title: "Prime Charlotte Location", desc: "Minutes from Uptown, I-485, I-85, top-rated schools, shopping, dining, and entertainment. City access, suburban peace." },
              { num: 10, title: "Seller Incentive Available", desc: "The seller is offering up to $5,000 toward closing costs — making homeownership even more affordable. Ask for details!" }
            ].map((reason) => (
              <div key={reason.num} className="bg-white border border-[#2d4a3e]/5 p-6 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2d4a3e] text-white flex items-center justify-center font-mono font-bold text-xs">
                  {reason.num}
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-[#2d4a3e] text-base">{reason.title}</h3>
                  <p className="text-xs text-[#2d4a3e]/70 leading-relaxed font-light">{reason.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Grid */}
      <section id="gallery" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-[#c4903a] font-bold block">[PHOTOGRAPHY BY DANIEL PADGETT]</span>
          <h2 className="text-3xl md:text-4xl font-serif text-[#2d4a3e]">The Property Gallery</h2>
          <p className="text-xs text-[#2d4a3e]/60 font-mono">Click on any image to open the interactive full-screen tour</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_IMAGES.map((img, idx) => {
            const isTall = idx === 0 || idx === 7 || idx === 15;
            const isWide = idx === 2 || idx === 12;
            return (
              <div 
                key={idx}
                onClick={() => handleOpenLightbox(idx)}
                className={`relative overflow-hidden cursor-pointer group border border-[#2d4a3e]/10 shadow-sm bg-black ${
                  isTall ? "md:row-span-2 h-[450px] md:h-[600px]" : "h-[280px]"
                } ${
                  isWide ? "lg:col-span-2" : ""
                }`}
              >
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  loading="lazy"
                  className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 text-[#2d4a3e] text-xs font-mono font-semibold uppercase shadow">
                    <Maximize2 className="h-3.5 w-3.5" /> View Photo
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Buy vs New Construction */}
      <section id="compare" className="bg-[#f0ece6] py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[#c4903a] font-bold block">[THE SMART CHOICE]</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#2d4a3e]">Why Buy This Home vs. New Construction?</h2>
          </div>

          <div className="bg-white border border-[#2d4a3e]/15 overflow-hidden shadow-sm">
            
            {/* Header */}
            <div className="grid grid-cols-3 bg-[#2d4a3e] text-white font-mono text-[10px] uppercase tracking-wider py-4 px-6 font-bold text-center border-b border-[#2d4a3e]/20">
              <div className="text-left">Factor</div>
              <div>7803 Paper Birch Dr</div>
              <div>New Construction</div>
            </div>

            {/* Rows */}
            {[
              { factor: "Price", birch: "$364,900 — established value, priced to sell", newConst: "Typically $400k+ in similar Charlotte communities" },
              { factor: "Lot Size & Yard", birch: "Fully fenced backyard with mature landscaping, pergola & fire pit", newConst: "Often postage-stamp lots, no trees, no landscaping" },
              { factor: "Outdoor Living", birch: "Custom pergola, stone fire pit, patio — all included", newConst: "Bare yard — you pay $5k–$15k+ to add these later" },
              { factor: "Move-In Timeline", birch: "Move in immediately — everything is ready", newConst: "6–12 months of construction delays, permits, and uncertainty" },
              { factor: "Upgrades & Finishes", birch: "Luxury vinyl plank floors, granite counters, included appliances", newConst: "Builder-grade basics — upgrades cost extra" },
              { factor: "HOA", birch: "Just $47/month", newConst: "Often $150–$300+/month in new communities" },
              { factor: "Community", birch: "Established Silverwood — pool, clubhouse, playground, mature trees", newConst: "Construction zones, empty lots, no established feel for years" },
              { factor: "Closing Cost Incentive", birch: "Seller offering up to $5,000 toward your closing costs", newConst: "Rarely offered on new construction unless incentives are baked into a higher price" }
            ].map((row, idx) => (
              <div 
                key={idx} 
                className={`grid grid-cols-3 text-xs py-4 px-6 items-center text-center border-b border-[#2d4a3e]/10 last:border-b-0 ${
                  idx % 2 === 0 ? "bg-[#faf9f5]" : "bg-white"
                }`}
              >
                <div className="text-left font-serif font-bold text-[#2d4a3e]">{row.factor}</div>
                <div className="text-[#2d4a3e] font-semibold px-2 flex justify-center items-center gap-1">
                  <span className="text-[#2d4a3e] text-xs font-bold">✔</span> {row.birch}
                </div>
                <div className="text-[#2d4a3e]/60 px-2 flex justify-center items-center gap-1">
                  <span className="text-red-700 text-xs">✘</span> {row.newConst}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center font-mono text-[9px] text-[#2d4a3e]/50">
            * Comparison based on typical new construction offerings in the Charlotte metro area. Actual new construction pricing and features vary by builder and community.
          </p>
        </div>
      </section>

      {/* Floor Plan Section */}
      <section id="floorplan" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="border border-dashed border-[#2d4a3e]/30 bg-[#f4f2eb] rounded-none p-12 text-center space-y-4">
          <span className="text-3xl block">📐</span>
          <h3 className="font-serif text-lg font-bold text-[#2d4a3e]">Official Floor Plan Mappings</h3>
          <p className="text-xs text-[#2d4a3e]/70 max-w-md mx-auto leading-relaxed font-sans">
            We are preparing the high-resolution vector floor plan layout for 7803 Paper Birch Dr. In the meantime, request the digital blueprint package directly.
          </p>
          <div className="pt-2">
            <a href="mailto:suesellscarolinas@gmail.com?subject=Floor Plan Request - 7803 Paper Birch">
              <Button size="sm" className="bg-[#2d4a3e] hover:bg-[#1f352c] text-white font-mono text-xs uppercase tracking-widest px-6 cursor-pointer">
                Request Floor Plan PDF
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Video Tour Section */}
      <section id="tour" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-[#c4903a] font-bold block">[VIRTUAL PROPERTY TOUR]</span>
          <h2 className="text-3xl md:text-4xl font-serif text-[#2d4a3e]">Walk Through the Property</h2>
        </div>

        <div className="relative aspect-video w-full max-w-4xl mx-auto bg-black border border-[#2d4a3e]/10 shadow-lg">
          <iframe 
            src="https://www.youtube.com/embed/wtbuvVIUk2c"
            title="7803 Paper Birch Dr — Property Tour"
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </section>

      {/* Map / Location Section */}
      <section id="location" className="bg-[#f4f2eb] py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-[#c4903a] font-bold block">[LOCATION &amp; SUBURB]</span>
            <h2 className="text-3xl md:text-4xl font-serif text-[#2d4a3e]">Silverwood &mdash; Charlotte&apos;s Finest</h2>
            <p className="text-base text-[#2d4a3e]/80 leading-relaxed font-light font-sans">
              Situated in the sought-after <strong>Silverwood</strong> community in northeast Charlotte, 7803 Paper Birch Dr offers the perfect blend of suburban tranquility and city access. Enjoy a low <strong>$47/month HOA</strong> that covers the community pool, clubhouse, and playground — just a short walk from your front door.
            </p>
            <p className="text-base text-[#2d4a3e]/80 leading-relaxed font-light font-sans">
              Minutes from Uptown Charlotte, major highways (I-485, I-85), top-rated schools, shopping, dining, and entertainment. This is more than a house — it&apos;s a place to put down roots and create lasting memories.
            </p>
          </div>

          {/* Embedded Map Container */}
          <div className="relative w-full h-[360px] bg-white border border-[#2d4a3e]/15 overflow-hidden shadow-sm">
            <iframe 
              src="https://www.openstreetmap.org/export/embed.html?bbox=-80.6693%2C35.2484%2C-80.6493%2C35.2684&amp;layer=mapnik&amp;marker=35.2584%2C-80.6593"
              className="absolute inset-0 w-full h-full border-0"
              scrolling="no"
              title="Property Location on OpenStreetMap"
            />
          </div>
        </div>
      </section>

      {/* Agent Section */}
      <section id="agent" className="py-20 px-6 max-w-4xl mx-auto">
        <div className="bg-[#2d4a3e] text-white p-8 md:p-12 border border-[#faf9f5]/15 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden shadow-md">
          
          {/* Subtle logo vector */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 opacity-5 pointer-events-none">
            <Home className="w-full h-full text-white" />
          </div>

          <div className="flex-shrink-0 text-center space-y-3">
            <div className="w-28 h-28 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-serif text-3xl text-white/80 mx-auto">
              SS
            </div>
            <span className="inline-block text-[10px] font-mono uppercase bg-[#faf9f5]/10 text-white/80 px-3 py-1">
              Broker / REALTOR&reg;
            </span>
          </div>

          <div className="space-y-4 text-center md:text-left flex-1">
            <div>
              <h3 className="text-2xl font-serif text-white font-bold">Suzanne Shaw</h3>
              <p className="text-xs font-mono text-[#8fcae3] mt-1">LPT Realty LLC &middot; License: NC 251125, SC 65256</p>
            </div>
            <p className="text-xs text-white/80 leading-relaxed font-light font-sans">
              With a passion for connecting people with their perfect home, Suzanne brings dedication, local expertise, and personalized service to every transaction. Whether you&apos;re buying or selling in the Charlotte area, she will guide you every step of the way.
            </p>
            <div className="pt-2 flex gap-3 flex-wrap justify-center md:justify-start">
              <a href="tel:+17048190620">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest px-4 cursor-pointer">
                  <Phone className="h-3 w-3 mr-1" /> (704) 819-0620
                </Button>
              </a>
              <a href="mailto:suesellscarolinas@gmail.com?subject=Schedule Showing - 7803 Paper Birch Dr">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest px-4 cursor-pointer">
                  <Mail className="h-3 w-3 mr-1" /> Email Suzanne
                </Button>
              </a>
              <a href="https://suesellscarolinas.com" target="_blank" rel="noopener">
                <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-mono text-[10px] uppercase tracking-widest px-4 cursor-pointer">
                  <Globe className="h-3 w-3 mr-1" /> suesellscarolinas.com
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Share / QR Code section */}
      <section className="border-t border-[#2d4a3e]/10 py-16 px-6 text-center bg-[#f4f2eb]/40 space-y-6">
        <div className="max-w-md mx-auto space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#c4903a] font-bold block">[SHARE THIS PROPERTY]</span>
          <p className="text-xs text-[#2d4a3e]/70 leading-relaxed font-sans">
            Scan this QR code with your mobile device to open the dedicated mobile property website immediately.
          </p>
          <div className="inline-block bg-white p-4 border border-[#2d4a3e]/10 shadow-sm rounded-none">
            <div style={{marginTop: "16.5px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap"}} className="text-xs">
              <a href="/docs/luxury-open-house-packet.html" target="_blank" className="inline-flex items-center gap-1 px-3 py-2 bg-[#2d4a3e] text-white font-mono text-[10px] uppercase tracking-wider shadow-sm hover:bg-[#1f352c] transition-colors">
                <Download className="h-3 w-3" /> Open House Packet
              </a>
              <a href="/docs/visitor-registration.html" target="_blank" className="inline-flex items-center gap-1 px-3 py-2 bg-[#c4903a] text-white font-mono text-[10px] uppercase tracking-wider shadow-sm hover:bg-[#b07f2e] transition-colors">
                <Download className="h-3 w-3" /> Visitor Sign-In
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2d4a3e]/10 pt-10 text-center text-[#2d4a3e]/50 text-[10px] font-mono space-y-4 max-w-5xl mx-auto px-6">
        <p>7803 Paper Birch Dr &middot; Charlotte, NC &middot; Presented by Suzanne Shaw, LPT Realty LLC</p>
        <p>License Info: NC 251125, SC 65256 &middot; Photography by Dan Padgett Photography &middot; Powered by ACMI Fleet</p>
      </footer>

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <div 
          onClick={handleCloseLightbox}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
        >
          {/* Close button */}
          <button 
            onClick={handleCloseLightbox}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev button */}
          <button 
            onClick={(e) => handleNavigateLightbox(-1, e)}
            className="absolute left-6 w-12 h-12 bg-white/5 hover:bg-white/15 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Main active image */}
          <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center justify-center space-y-3">
            <img 
              src={GALLERY_IMAGES[activeImageIndex].src} 
              alt={GALLERY_IMAGES[activeImageIndex].alt} 
              className="max-w-full max-h-[80vh] object-contain shadow-2xl border border-white/5"
            />
            <p className="text-white/60 font-mono text-[10px] uppercase tracking-wider">
              Photo {activeImageIndex + 1} of {GALLERY_IMAGES.length} &mdash; {GALLERY_IMAGES[activeImageIndex].alt}
            </p>
          </div>

          {/* Next button */}
          <button 
            onClick={(e) => handleNavigateLightbox(1, e)}
            className="absolute right-6 w-12 h-12 bg-white/5 hover:bg-white/15 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Scroll to Top Floating Button */}
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-[#2d4a3e] hover:bg-[#1f352c] text-white shadow-lg border border-[#faf9f5]/10 rounded-full flex items-center justify-center transition-all duration-300 z-30 cursor-pointer animate-fade-in"
          title="Scroll to Top"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}

    </div>
  );
}
