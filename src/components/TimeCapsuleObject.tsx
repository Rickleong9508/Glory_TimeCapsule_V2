import { motion } from "motion/react";
import { Language } from "../types";
import { translations } from "../locales";

interface TimeCapsuleProps {
  isOpen: boolean;
  onClick: () => void;
  isSearching: boolean;
  status: "idle" | "error" | "found";
  lang: Language;
}

export default function TimeCapsuleObject({ isOpen, onClick, isSearching, status, lang }: TimeCapsuleProps) {
  const t = translations[lang];

  // Colors & Glow adjustments based on query status
  const glowOutline = {
    idle: "",
    error: "animate-pulse",
    found: "",
  }[status];

  // physical machine vibration feedback while retrieving records
  const shakeVariants = {
    idle: {
      y: [0, -6, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    searching: {
      x: [0, -1.5, 1.5, -1, 1, -1.2, 1.2, 0],
      y: [0, 1.2, -1.2, 0.8, -0.8, 1.2, -1.2, 0],
      transition: {
        duration: 0.1,
        repeat: Infinity,
        ease: "linear",
      },
    },
    open: {
      y: -15,
      scale: 1.02,
      transition: { duration: 0.8, ease: "easeOut" },
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      {/* Outer ambient floor shadow / glow matching state */}
      <div className="absolute bottom-6 w-72 h-10 bg-radial from-cyan-500/10 to-transparent blur-md pointer-events-none" />

      {/* Interactive Glowing Capsule Holder */}
      <motion.div
        id="interactive-time-capsule"
        onClick={onClick}
        whileHover={{ scale: isOpen ? 1 : 1.03 }}
        whileTap={{ scale: isOpen ? 1 : 0.98 }}
        variants={shakeVariants}
        animate={isOpen ? "open" : isSearching ? "searching" : "idle"}
        className={`relative w-[340px] h-[410px] md:w-[380px] md:h-[450px] cursor-pointer rounded-3xl flex items-center justify-center transition-all duration-700 ${glowOutline}`}
      >
        {/* TIME CAPSULE SCI-FI HARDWARE CORE VECTOR */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-visible">
          <svg
            className="w-full h-full filter drop-shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            viewBox="0 0 360 420"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* 1. SCIFI FLOOR PLATES / FLOOR DOCKING PERSPECTIVE RING */}
            <ellipse cx="180" cy="390" rx="95" ry="16" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <ellipse cx="180" cy="390" rx="115" ry="20" fill="transparent" stroke="rgba(34,211,238,0.15)" strokeWidth="1.2" strokeDasharray="6 12" />
            
            {/* Docking radial lines connecting base */}
            <line x1="80" y1="395" x2="110" y2="385" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="280" y1="395" x2="250" y2="385" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="180" y1="375" x2="180" y2="395" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* 2. MAIN DETAILED GLASS CYLINDER BACKDROP & GRID */}
            <rect x="110" y="100" width="140" height="215" rx="10" fill="url(#coreMatrixPattern)" stroke="url(#glassOutlineGrad)" strokeWidth="2" />
            
            {/* Internal vertical and horizontal light trackers (Calibration Ticker) */}
            {/* Left measurement ticks */}
            <g opacity="0.35">
              <line x1="118" y1="120" x2="124" y2="120" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="118" y1="140" x2="122" y2="140" stroke="#22d3ee" strokeWidth="1" />
              <line x1="118" y1="160" x2="124" y2="160" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="118" y1="180" x2="122" y2="180" stroke="#22d3ee" strokeWidth="1" />
              <line x1="118" y1="200" x2="126" y2="200" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="118" y1="220" x2="122" y2="220" stroke="#22d3ee" strokeWidth="1" />
              <line x1="118" y1="240" x2="124" y2="240" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="118" y1="260" x2="122" y2="260" stroke="#22d3ee" strokeWidth="1" />
              <line x1="118" y1="280" x2="124" y2="280" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="118" y1="300" x2="126" y2="300" stroke="#22d3ee" strokeWidth="1.5" />
            </g>

            {/* Right measurement ticks */}
            <g opacity="0.35">
              <line x1="242" y1="120" x2="236" y2="120" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="242" y1="140" x2="238" y2="140" stroke="#22d3ee" strokeWidth="1" />
              <line x1="242" y1="160" x2="236" y2="160" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="242" y1="180" x2="238" y2="180" stroke="#22d3ee" strokeWidth="1" />
              <line x1="242" y1="200" x2="234" y2="200" stroke="#22d3ee" strokeWidth="1.5" />
              <line x1="242" y1="220" x2="238" y2="220" stroke="#22d3ee" strokeWidth="1" />
              <line x1="242" y1="240" x2="236" y2="240" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="242" y1="260" x2="238" y2="260" stroke="#22d3ee" strokeWidth="1" />
              <line x1="242" y1="280" x2="236" y2="280" stroke="#22d3ee" strokeWidth="1.2" />
              <line x1="242" y1="300" x2="234" y2="300" stroke="#22d3ee" strokeWidth="1.5" />
            </g>

            {/* 3. GLOWING CYAN HOURGLASS SHAPE */}
            <g id="neon-hourglass-assembly">
              {/* Giant back glow sphere */}
              <circle cx="180" cy="205" r="45" fill="url(#hourglassAmbientGlow)" opacity="0.45" />

              {/* Glowing sand/light beam from top bulb to bottom bulb */}
              <motion.line
                x1="180"
                y1="135"
                x2="180"
                y2="275"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeDasharray="4 6"
                animate={isSearching ? { strokeDashoffset: [-20, 20] } : { strokeDashoffset: [-10, 10] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                filter="url(#neonGlow)"
              />

              {/* Upper glass bulb bulb */}
              <path
                d="M136 130 C 136 185, 172 205, 180 205 C 188 205, 224 185, 224 130 Z"
                fill="rgba(6, 182, 212, 0.05)"
                stroke="url(#hourglassOutlineGrad)"
                strokeWidth="2"
                filter="url(#neonGlow)"
              />

              {/* Lower glass bulb bulb */}
              <path
                d="M136 280 C 136 225, 172 205, 180 205 C 188 205, 224 225, 224 280 Z"
                fill="rgba(6, 182, 212, 0.05)"
                stroke="url(#hourglassOutlineGrad)"
                strokeWidth="2"
                filter="url(#neonGlow)"
              />

              {/* Digital Flowing Particles / Grains of Time (Numbers and code streams) */}
              <g id="hourglass-flowing-data">
                {/* Simulated falling code/numbers inside the top glass */}
                <motion.text
                  x="165" y="150"
                  fill="#67e8f9" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.8"
                  animate={isSearching ? { y: [142, 195], opacity: [0, 1, 0] } : { y: [145, 185], opacity: [0, 0.7, 0] }}
                  transition={{ duration: 2.1, repeat: Infinity, delay: 0.1 }}
                >
                  9
                </motion.text>
                <motion.text
                  x="192" y="165"
                  fill="#22d3ee" fontSize="9" fontFamily="monospace" opacity="0.6"
                  animate={isSearching ? { y: [155, 198], opacity: [0, 1, 0] } : { y: [160, 180], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
                >
                  0
                </motion.text>
                <motion.text
                  x="152" y="170"
                  fill="#22d3ee" fontSize="11" fontFamily="monospace" opacity="0.7"
                  animate={isSearching ? { y: [165, 195], opacity: [0, 0.8, 0] } : { y: [168, 182], opacity: [0, 0.6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 1.2 }}
                >
                  3
                </motion.text>
                <motion.text
                  x="205" y="145"
                  fill="#67e8f9" fontSize="10" fontFamily="monospace" opacity="0.8"
                  animate={isSearching ? { y: [140, 190], opacity: [0, 1, 0] } : { y: [142, 175], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: 0.8 }}
                >
                  5
                </motion.text>

                {/* Simulated dynamic pile accumulation at the bottom bulb */}
                <motion.path
                  d="M150 274 Q180 262 210 274"
                  stroke="#22d3ee"
                  strokeWidth="3.5"
                  fill="none"
                  filter="url(#neonGlow)"
                  animate={isSearching ? { strokeWidth: [3, 4.5, 3] } : { strokeWidth: [3.5, 4, 3.5] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Scattered digits resting in the bottom sand bowl */}
                <motion.text
                  x="170" y="272" fill="#22d3ee" fontSize="8" fontFamily="monospace" opacity="0.75"
                  animate={{ y: [272, 270, 272] }} transition={{ duration: 2, repeat: Infinity }}
                >2</motion.text>
                <motion.text
                  x="185" y="273" fill="#67e8f9" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.9"
                  animate={{ y: [273, 271, 273] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                >0</motion.text>
                <motion.text
                  x="160" y="278" fill="#22d3ee" fontSize="7" fontFamily="monospace" opacity="0.5"
                >3</motion.text>
                <motion.text
                  x="195" y="277" fill="#67e8f9" fontSize="9" fontFamily="monospace" opacity="0.8"
                >5</motion.text>
                <motion.text
                  x="178" y="278" fill="#22d3ee" fontSize="8" fontFamily="monospace" opacity="0.6"
                >6</motion.text>
              </g>
            </g>

            {/* Glass glares overlay */}
            <path d="M115 105 L115 310" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <path d="M118 105 C130 110, 150 110, 160 105" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
            <path d="M245 105 L245 310" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

            {/* 4. SOLID METALLIC TOP HATCH CAP */}
            <g id="top-metallic-pod-hatch">
              {/* Sliding top cover base */}
              <path
                d="M102 100 C102 52, 258 52, 258 100 Z"
                fill="url(#metallicPlateGrad)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              {/* Segmented sci-fi plating / helmet grooves */}
              <path d="M125 70 C145 55, 215 55, 235 70" stroke="rgba(0,0,0,0.4)" strokeWidth="2.2" />
              <path d="M125 70 C145 55, 215 55, 235 70" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <path d="M171 49 L171 70" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
              <path d="M189 49 L189 70" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
              
              {/* Central horizontal heavy collar band */}
              <rect x="96" y="90" width="168" height="12" rx="4" fill="url(#metallicPlateGrad)" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
              <rect x="98" y="92" width="164" height="2" fill="rgba(255,255,255,0.2)" />
              {/* Circular bolt indicators */}
              <circle cx="106" cy="96" r="1.5" fill="rgba(0,0,0,0.6)" />
              <circle cx="254" cy="96" r="1.5" fill="rgba(0,0,0,0.6)" />
            </g>

            {/* 5. HEAVY INDUSTRIAL MACHINE BASE SUPPORT */}
            <g id="machine-base-pedestal">
              {/* Flared low base platform */}
              <path
                d="M78 355 L106 312 L254 312 L282 355 C304 365, 305 385, 260 385 L100 385 C55 385, 56 365, 78 355 Z"
                fill="url(#metallicPlateGrad)"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="1.8"
              />

              {/* Curved outer metallic belt collar on base */}
              <path
                d="M106 312 C106 312, 180 322, 254 312 L250 330 C250 330, 180 340, 110 330 Z"
                fill="rgba(30, 41, 59, 0.9)"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />

              {/* Slanted warning lights structure (Wings) / status indicators */}
              {/* Left Wing Support */}
              <path d="M85 340 L108 312 L108 335 L88 353 Z" fill="url(#metallicDarkGrad)" stroke="rgba(0,0,0,0.3)" />
              {/* Left orange led indicator */}
              <polygon
                points="92,336 100,326 104,334"
                fill={isSearching ? "#fbbf24" : "#f59e0b"}
                filter="url(#orangeGlow)"
                className={isSearching ? "animate-pulse" : ""}
              />

              {/* Right Wing Support */}
              <path d="M275 340 L252 312 L252 335 L272 353 Z" fill="url(#metallicDarkGrad)" stroke="rgba(0,0,0,0.3)" />
              {/* Right orange led indicator */}
              <polygon
                points="268,336 260,326 256,334"
                fill={isSearching ? "#fbbf24" : "#f59e0b"}
                filter="url(#orangeGlow)"
                className={isSearching ? "animate-pulse" : ""}
              />

              {/* 6. RETRO DIGITAL INTERACTIVE CHRONO MATRIX LED DISPLAY */}
              <g id="digital-milestone-terminal">
                {/* Matrix Screen background */}
                <rect x="125" y="340" width="110" height="32" rx="6" fill="#141517" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                
                {/* Led grid overlay lines under numbers to make it realistic */}
                <line x1="125" y1="344" x2="235" y2="344" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
                <line x1="125" y1="348" x2="235" y2="348" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
                <line x1="125" y1="352" x2="235" y2="352" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
                <line x1="125" y1="356" x2="235" y2="356" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
                <line x1="125" y1="360" x2="235" y2="360" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
                <line x1="125" y1="364" x2="235" y2="364" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
                <line x1="125" y1="368" x2="235" y2="368" stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />

                {/* Matrix display output: "JUNE 2026/2035" or "GLORY V2035" */}
                <text
                  x="180"
                  y="353"
                  fill="#f59e0b"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="1.2"
                  filter="url(#orangeGlow)"
                >
                  JUNE 2026
                </text>
                
                <text
                  x="180"
                  y="364"
                  fill="#fbbf24"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="1.5"
                  className="animate-pulse"
                  opacity="0.85"
                >
                  V2035 REMAINING
                </text>
              </g>

              {/* Bottom heavy handle lock */}
              <rect x="165" y="375" width="30" height="8" rx="2" fill="url(#metallicPlateGrad)" stroke="rgba(0,0,0,0.5)" />
              <rect x="170" y="377" width="20" height="2" fill="#fbbf24" filter="url(#orangeGlow)" />
            </g>

            {/* SVG Gradients & Filters list */}
            <defs>
              {/* Metallic steel grey gradient */}
              <linearGradient id="metallicPlateGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="25%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="75%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Dark internal machinery gradient */}
              <linearGradient id="metallicDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Soft transparent cyan grid background inside the cylinder */}
              <radialGradient id="hourglassAmbientGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>

              {/* Glass subtle vertical shine gradient */}
              <linearGradient id="glassOutlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="15%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.1)" />
                <stop offset="85%" stopColor="#22d3ee" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
              </linearGradient>

              {/* Neon cyan glow effect */}
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Amber warning light glow effect */}
              <filter id="orangeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Sci-fi square matrix scanline patterns */}
              <pattern id="coreMatrixPattern" width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" fill="#030712" />
                <path d="M 12 0 L 0 0 0 12" fill="none" stroke="rgba(34, 211, 238, 0.03)" strokeWidth="0.8" />
              </pattern>
            </defs>
          </svg>
        </div>

        {/* 7. HIGH ENERGY VERTICAL DISCHARGE BEAM (Lifting/Revealing) */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 0.9, 0.7, 0], scaleY: [0, 2.8, 2.8, 0] }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            className="absolute bottom-1/3 w-8 bg-gradient-to-t from-transparent via-cyan-300 to-white origin-bottom rounded-full blur-[4px] pointer-events-none"
            style={{ height: "110px" }}
          />
        )}
      </motion.div>

      {/* Dynamic Instruction panel below the capsule cylinder */}
      {!isOpen && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-xs font-mono tracking-widest text-cyan-400/80 hover:text-white transition-colors pointer-events-none uppercase text-center flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          {isSearching 
            ? t.capsuleHintSearching 
            : status === "error" 
            ? t.capsuleHintError 
            : t.capsuleHintNormal}
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </motion.p>
      )}
    </div>
  );
}


