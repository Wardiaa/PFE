// components/ui/template-card.tsx
import { useState } from "react";
import { cn } from "../../lib/utils";
import type { Template } from "../../lib/templates";
import { motion, AnimatePresence } from "framer-motion";

interface TemplateCardProps {
  template: Template;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

// Map templates to Mentimeter's specific pastel theme colors
const getMentimeterColors = (category: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    Education: { bg: "bg-[#EEF2FF]", text: "text-indigo-900" },
    Business: { bg: "bg-[#FDF2F2]", text: "text-rose-900" },
    "Team Building": { bg: "bg-[#F0F9FF]", text: "text-sky-900" },
    Entertainment: { bg: "bg-[#F5F3FF]", text: "text-purple-900" },
    "Game Show": { bg: "bg-[#FFFBEB]", text: "text-amber-900" },
    default: { bg: "bg-[#F8F9FA]", text: "text-slate-900" },
  };
  return map[category] || map.default;
};

// Creative category-specific SVG background illustrations
const CategoryIllustration = ({ category }: { category: string }) => {
  if (category === "Education") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Atom — centrepiece, right half */}
        <g transform="translate(163, 60)" opacity="0.19">
          {/* Three orbital rings */}
          <ellipse cx="0" cy="0" rx="26" ry="9" stroke="#4338CA" strokeWidth="1.6" fill="none" />
          <ellipse cx="0" cy="0" rx="26" ry="9" stroke="#4338CA" strokeWidth="1.6" fill="none" transform="rotate(60)" />
          <ellipse cx="0" cy="0" rx="26" ry="9" stroke="#4338CA" strokeWidth="1.6" fill="none" transform="rotate(-60)" />
          {/* Nucleus */}
          <circle cx="0" cy="0" r="7"   fill="#4338CA" />
          <circle cx="0" cy="0" r="3.5" fill="#6366F1" />
          {/* One electron per orbit — placed at orbit tip */}
          <circle cx="26"  cy="0"    r="4" fill="#6366F1" />
          <circle cx="13"  cy="-22"  r="3.5" fill="#818CF8" />
          <circle cx="-13" cy="22"   r="3.5" fill="#A5B4FC" />
        </g>

        {/* Lightbulb — upper-left of the decoration zone */}
        <g transform="translate(112, 6)" opacity="0.21">
          {/* Glass bulb: semicircle arc upward + two short lines for neck */}
          <path d="M 6 30 A 16 16 0 0 1 34 30 L 31 42 L 9 42 Z" fill="#FBBF24" />
          {/* Filament — W shape inside bulb */}
          <path d="M 13 36 L 17 26 L 20 32 L 23 26 L 27 36"
            stroke="#fff" strokeWidth="1.6" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          {/* Socket */}
          <rect x="9"  y="42" width="22" height="5" rx="1.5" fill="#4338CA" />
          <rect x="11" y="47" width="18" height="3.5" rx="1" fill="#3730A3" />
          {/* Glow rays */}
          <line x1="20" y1="11"  x2="20" y2="5"    stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="33" y1="15"  x2="37" y2="11"   stroke="#FBBF24" strokeWidth="2"   strokeLinecap="round" />
          <line x1="7"  y1="15"  x2="3"  y2="11"   stroke="#FBBF24" strokeWidth="2"   strokeLinecap="round" />
          <line x1="38" y1="27"  x2="43" y2="25"   stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="2"  y1="27"  x2="-3" y2="25"   stroke="#FBBF24" strokeWidth="1.6" strokeLinecap="round" />
        </g>

        {/* E = mc² floating near bottom */}
        <text x="114" y="104" fontSize="9" fontWeight="700" fill="#4338CA" opacity="0.2"
          fontFamily="serif" fontStyle="italic">E = mc²</text>

        {/* Tiny accent dots */}
        <circle cx="112" cy="72" r="2.5" fill="#6366F1" opacity="0.14" />
        <circle cx="196" cy="36" r="2"   fill="#818CF8" opacity="0.13" />
        <circle cx="189" cy="96" r="2"   fill="#4338CA" opacity="0.12" />
      </svg>
    );
  }

  if (category === "Business") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Bar chart — bottom-right */}
        <g transform="translate(118, 32)" opacity="0.2">
          <rect x="0" y="48" width="12" height="24" rx="2" fill="#E11D48" />
          <rect x="16" y="28" width="12" height="44" rx="2" fill="#BE123C" />
          <rect x="32" y="12" width="12" height="60" rx="2" fill="#E11D48" />
          <rect x="48" y="32" width="12" height="40" rx="2" fill="#BE123C" />
          <rect x="64" y="4" width="12" height="68" rx="2" fill="#E11D48" />
          {/* Trend arrow on top of bars */}
          <polyline points="6,44 22,24 38,8 54,28 70,0" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
          <polygon points="70,0 76,10 64,10" fill="#FB7185" opacity="0.8" />
        </g>

        {/* Briefcase — top-right */}
        <g transform="translate(158, 8)" opacity="0.16">
          <rect x="0" y="8" width="32" height="24" rx="3" fill="#BE123C" />
          <rect x="10" y="4" width="12" height="6" rx="2" stroke="#BE123C" strokeWidth="2" fill="none" />
          <rect x="0" y="17" width="32" height="2" fill="#FFF" opacity="0.3" />
          <rect x="14" y="14" width="4" height="8" rx="1" fill="#F43F5E" />
        </g>

        {/* Dollar sign — drawn as SVG paths so it reads clearly at small sizes */}
        <g transform="translate(110, 78)" opacity="0.16">
          {/* Outer ring */}
          <circle cx="12" cy="12" r="12" stroke="#E11D48" strokeWidth="2.5" fill="none" />
          {/* Vertical stem of the $ — extends above and below the S-curve */}
          <line x1="12" y1="3" x2="12" y2="21" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
          {/* S-curve: top bowl opens left, bottom bowl opens right */}
          <path
            d="M 18 8 C 18 4 6 4 6 9 C 6 13 18 13 18 15 C 18 20 6 20 6 16"
            stroke="#E11D48"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Small decorative dots */}
        <circle cx="112" cy="28" r="3" fill="#FB7185" opacity="0.14" />
        <circle cx="196" cy="90" r="2.5" fill="#E11D48" opacity="0.13" />
        <circle cx="186" cy="18" r="2" fill="#BE123C" opacity="0.12" />
        <text x="148" y="112" fontSize="9" fontWeight="700" fill="#BE123C" opacity="0.13" fontFamily="sans-serif">↑ 24%</text>
      </svg>
    );
  }

  if (category === "Team Building") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Three celebrating figures — arms raised */}

        {/* Figure LEFT */}
        <g opacity="0.2">
          <circle cx="138" cy="54" r="8" fill="#0EA5E9" />
          {/* torso */}
          <line x1="138" y1="62" x2="138" y2="83" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" />
          {/* left arm up-left */}
          <line x1="138" y1="67" x2="124" y2="55" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
          {/* right arm towards centre figure */}
          <line x1="138" y1="67" x2="150" y2="60" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
          {/* legs */}
          <line x1="138" y1="83" x2="132" y2="98" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
          <line x1="138" y1="83" x2="144" y2="98" stroke="#0EA5E9" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Figure CENTRE — slightly taller / more prominent */}
        <g opacity="0.22">
          <circle cx="161" cy="48" r="9" fill="#0284C7" />
          {/* torso */}
          <line x1="161" y1="57" x2="161" y2="80" stroke="#0284C7" strokeWidth="3.5" strokeLinecap="round" />
          {/* arms both up — V pose */}
          <line x1="161" y1="63" x2="147" y2="50" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
          <line x1="161" y1="63" x2="175" y2="50" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
          {/* legs */}
          <line x1="161" y1="80" x2="154" y2="97" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
          <line x1="161" y1="80" x2="168" y2="97" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Figure RIGHT */}
        <g opacity="0.2">
          <circle cx="184" cy="54" r="8" fill="#38BDF8" />
          {/* torso */}
          <line x1="184" y1="62" x2="184" y2="83" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
          {/* left arm towards centre */}
          <line x1="184" y1="67" x2="172" y2="60" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          {/* right arm up-right */}
          <line x1="184" y1="67" x2="198" y2="55" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          {/* legs */}
          <line x1="184" y1="83" x2="178" y2="98" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
          <line x1="184" y1="83" x2="190" y2="98" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Confetti burst above the trio */}
        <rect x="136" y="22" width="7" height="4" rx="1" fill="#FBBF24" opacity="0.3"  transform="rotate(20  139 24)" />
        <rect x="152" y="15" width="6" height="3" rx="1" fill="#0EA5E9" opacity="0.28" transform="rotate(-12 155 16)" />
        <rect x="168" y="10" width="7" height="4" rx="1" fill="#38BDF8" opacity="0.28" transform="rotate(30  171 12)" />
        <rect x="182" y="18" width="5" height="3" rx="1" fill="#FBBF24" opacity="0.28" transform="rotate(-25 184 19)" />
        <rect x="196" y="28" width="5" height="3" rx="1" fill="#0284C7" opacity="0.25" transform="rotate(15  198 29)" />
        <circle cx="145" cy="16" r="3"   fill="#38BDF8" opacity="0.25" />
        <circle cx="161" cy="8"  r="3.5" fill="#FBBF24" opacity="0.28" />
        <circle cx="177" cy="15" r="2.5" fill="#0EA5E9" opacity="0.24" />
        <circle cx="194" cy="12" r="2"   fill="#38BDF8" opacity="0.22" />

        {/* Star accent above centre figure */}
        <polygon
          points="161,2 162.8,7.5 168.5,7.5 163.8,10.9 165.6,16.4 161,13 156.4,16.4 158.2,10.9 153.5,7.5 159.2,7.5"
          fill="#FBBF24" opacity="0.3"
        />

        {/* Tiny ground line */}
        <line x1="118" y1="100" x2="200" y2="100" stroke="#0EA5E9" strokeWidth="1" opacity="0.1" strokeLinecap="round" />
      </svg>
    );
  }

  if (category === "Entertainment") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Stars scattered */}
        <g opacity="0.2">
          <polygon points="155,12 157.9,20.8 167,20.8 159.5,26.2 162.4,35 155,29.6 147.6,35 150.5,26.2 143,20.8 152.1,20.8" fill="#7C3AED" />
          <polygon points="185,55 186.5,59.8 191.5,59.8 187.5,62.7 189,67.5 185,64.6 181,67.5 182.5,62.7 178.5,59.8 183.5,59.8" fill="#A855F7" />
          <polygon points="168,85 169,88.1 172.2,88.1 169.7,89.9 170.6,93 168,91.2 165.4,93 166.3,89.9 163.8,88.1 167,88.1" fill="#7C3AED" />
        </g>

        {/* Music notes */}
        <g opacity="0.17">
          <g transform="translate(128, 28)">
            <circle cx="4" cy="22" r="5" fill="#8B5CF6" />
            <rect x="9" y="4" width="2.5" height="18" fill="#8B5CF6" />
            <path d="M9 4 h12 v5 h-12 z" fill="#8B5CF6" />
          </g>
          <g transform="translate(150, 60)">
            <circle cx="4" cy="18" r="4.5" fill="#A855F7" />
            <rect x="8.5" y="3" width="2.5" height="15" fill="#A855F7" />
            <path d="M8.5 3 h11 v5 h-11 z" fill="#A855F7" />
          </g>
        </g>

        {/* Confetti dots */}
        <rect x="115" y="15" width="6" height="6" rx="1" fill="#F59E0B" opacity="0.2" transform="rotate(20, 118, 18)" />
        <rect x="192" y="40" width="5" height="5" rx="1" fill="#EC4899" opacity="0.18" transform="rotate(-15, 194, 43)" />
        <rect x="178" y="100" width="5" height="5" rx="1" fill="#6366F1" opacity="0.17" transform="rotate(30, 180, 102)" />
        <circle cx="197" cy="18" r="3.5" fill="#F472B6" opacity="0.2" />
        <circle cx="120" cy="95" r="3" fill="#FBBF24" opacity="0.18" />
        <circle cx="140" cy="48" r="2.5" fill="#A855F7" opacity="0.15" />

        {/* Spotlight cone from top-right */}
        <path d="M200 0 L175 0 L110 120 L200 120 Z" fill="#7C3AED" opacity="0.04" />

        {/* Sparkle text */}
        <text x="112" y="30" fontSize="12" fill="#A855F7" opacity="0.18">✨</text>
        <text x="188" y="112" fontSize="10" fill="#8B5CF6" opacity="0.16">✦</text>
      </svg>
    );
  }

  if (category === "Game Show") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Spotlight beams from bottom-right corner */}
        <g opacity="0.07">
          <path d="M200 120 L185 120 L120 0 L140 0 Z" fill="#FBBF24" />
          <path d="M200 120 L200 105 L145 0 L160 0 Z" fill="#F59E0B" />
          <path d="M200 120 L168 120 L108 0 L125 0 Z" fill="#FDE68A" />
        </g>

        {/* Prize wheel — centrepiece, right side */}
        <g transform="translate(152, 22)" opacity="0.88">
          <circle cx="28" cy="28" r="28" fill="#D97706" opacity="0.22" />
          <path d="M28 28 L28 0 A28 28 0 0 1 47.8 8.2 Z"  fill="#F59E0B" opacity="0.55" />
          <path d="M28 28 L47.8 8.2 A28 28 0 0 1 56 28 Z"  fill="#EF4444" opacity="0.55" />
          <path d="M28 28 L56 28 A28 28 0 0 1 47.8 47.8 Z" fill="#F59E0B" opacity="0.55" />
          <path d="M28 28 L47.8 47.8 A28 28 0 0 1 28 56 Z" fill="#EF4444" opacity="0.55" />
          <path d="M28 28 L28 56 A28 28 0 0 1 8.2 47.8 Z"  fill="#F59E0B" opacity="0.55" />
          <path d="M28 28 L8.2 47.8 A28 28 0 0 1 0 28 Z"   fill="#EF4444" opacity="0.55" />
          <path d="M28 28 L0 28 A28 28 0 0 1 8.2 8.2 Z"    fill="#F59E0B" opacity="0.55" />
          <path d="M28 28 L8.2 8.2 A28 28 0 0 1 28 0 Z"    fill="#EF4444" opacity="0.55" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={i}
                x1="28" y1="28"
                x2={28 + 28 * Math.cos(rad)}
                y2={28 + 28 * Math.sin(rad)}
                stroke="#fff"
                strokeWidth="1.2"
                opacity="0.6"
              />
            );
          })}
          <circle cx="28" cy="28" r="28" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
          <circle cx="28" cy="28" r="5" fill="#fff" opacity="0.9" />
          <circle cx="28" cy="28" r="2.5" fill="#D97706" opacity="0.9" />
          {/* Pointer pin at top */}
          <polygon points="28,0 24,-7 32,-7" fill="#EF4444" opacity="0.95" />
        </g>

        {/* Trophy — left of wheel */}
        <g transform="translate(118, 52)" opacity="0.2">
          <path d="M6 0 h18 v14 q0 10 -9 14 q-9 -4 -9 -14 Z" fill="#FBBF24" />
          <path d="M6 4 q-8 0 -8 8 q0 8 8 8"  stroke="#FBBF24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M24 4 q8 0 8 8 q0 8 -8 8"  stroke="#FBBF24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="12" y="28" width="6" height="8" fill="#FBBF24" />
          <rect x="7" y="36" width="16" height="3" rx="1" fill="#FBBF24" />
          <polygon points="15,6 16.2,9.6 20,9.6 17,11.8 18.2,15.4 15,13.2 11.8,15.4 13,11.8 10,9.6 13.8,9.6" fill="#fff" opacity="0.8" />
        </g>

        {/* Confetti burst — amber/red palette */}
        <rect x="113" y="10" width="7" height="4" rx="1" fill="#FBBF24" opacity="0.3"  transform="rotate(25 116 12)" />
        <rect x="140" y="6"  width="5" height="3" rx="1" fill="#EF4444" opacity="0.28" transform="rotate(-18 142 7)" />
        <rect x="196" y="25" width="6" height="3" rx="1" fill="#F59E0B" opacity="0.26" transform="rotate(40 199 26)" />
        <rect x="112" y="85" width="5" height="3" rx="1" fill="#FBBF24" opacity="0.25" transform="rotate(-30 114 86)" />
        <rect x="190" y="95" width="6" height="3" rx="1" fill="#EF4444" opacity="0.25" transform="rotate(15 193 96)" />
        <circle cx="115" cy="50" r="3"    fill="#F59E0B" opacity="0.22" />
        <circle cx="197" cy="10" r="3.5"  fill="#FBBF24" opacity="0.25" />
        <circle cx="148" cy="100" r="2.5" fill="#EF4444" opacity="0.22" />

        {/* Stars */}
        <polygon points="117,28 118.4,32.3 123,32.3 119.3,34.9 120.7,39.2 117,36.6 113.3,39.2 114.7,34.9 111,32.3 115.6,32.3" fill="#FBBF24" opacity="0.3" />
        <polygon points="196,60 197,63.1 200.2,63.1 197.7,64.9 198.6,68 196,66.2 193.4,68 194.3,64.9 191.8,63.1 195,63.1" fill="#F59E0B" opacity="0.25" />

        {/* LIVE badge */}
        <rect x="113" y="95" width="22" height="10" rx="3" fill="#EF4444" opacity="0.3" />
        <text x="116" y="103" fontSize="6" fontWeight="800" fill="#fff" opacity="0.9" fontFamily="sans-serif" letterSpacing="0.5">LIVE</text>
      </svg>
    );
  }

  // Default fallback — subtle dot grid
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[...Array(5)].map((_, col) =>
        [...Array(4)].map((_, row) => (
          <circle
            key={`${col}-${row}`}
            cx={115 + col * 18}
            cy={18 + row * 28}
            r="2.5"
            fill="#94A3B8"
            opacity="0.18"
          />
        ))
      )}
    </svg>
  );
};

export function TemplateCard({ template, selected, onSelect, onPreview }: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getMentimeterColors(template.category);
  const questionsCount = template.questions?.length || 0;

  return (
    <div
      className="group relative flex flex-col h-full transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card Body */}
      <div
        onClick={onSelect}
        className={cn(
          "flex-1 flex flex-col rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200",
          selected
            ? "border-indigo-600 shadow-md"
            : "border-transparent shadow-sm bg-white hover:shadow-lg"
        )}
      >
        {/* Top: The "Slide" Preview Area */}
        <div className={cn("relative aspect-[16/10] p-6 overflow-hidden", colors.bg)}>
          {/* Category-specific creative background illustration */}
          <CategoryIllustration category={template.category} />

          {/* Mock Slide Content (Mentimeter Style) — sits above illustration */}
          <div className="relative z-10 space-y-2 max-w-[75%]">
            <div className={cn("text-xs font-bold mb-1 opacity-80 uppercase tracking-tight", colors.text)}>
              {template.category}
            </div>
            <h4 className={cn("text-sm font-semibold leading-tight line-clamp-3", colors.text)}>
              {template.questions?.[0]?.title || "How would you describe your team?"}
            </h4>
          </div>

          {/* Hover Overlay Button */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center p-4 z-20"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onPreview(); }}
                  className="bg-[#1A1D21] hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-xl transition-transform active:scale-95 cursor-pointer"
                >
                  Preview
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom: Information Area */}
        <div className="bg-white p-4 pt-5 border-t border-slate-100 flex-grow">
          <h3 className="text-[15px] font-semibold text-[#1A1D21] mb-1 line-clamp-1">
            {template.name}
          </h3>
          <p className="text-xs text-[#6D7278] font-medium">
            {questionsCount} slides
          </p>
        </div>
      </div>
    </div>
  );
}
