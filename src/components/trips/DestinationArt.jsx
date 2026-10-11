import { useId } from 'react'
import { cn } from '../../lib/ui'

// Postcard-style destination illustrations (pure SVG — always available, never a broken image).
const PALETTES = [
  { sky: ['#0EA5E9', '#7DD3FC'], sun: '#FFC24B', ground: '#0B1D33' },
  { sky: ['#FF8A4C', '#FFD3B5'], sun: '#FFF1E7', ground: '#1D3A63' },
  { sky: ['#2DD4BF', '#CCFBF1'], sun: '#FFC24B', ground: '#0F766E' },
  { sky: ['#1D3A63', '#0EA5E9'], sun: '#F3F8FC', ground: '#0B1D33' },
]

const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

function Skyline({ color }) {
  return (
    <path
      fill={color}
      d="M0 150 V112 h18 V96 h14 v16 h10 V80 h16 v32 h8 V102 h20 V70 l10 -12 l10 12 v42 h12 V92 h18 v20 h10 V86 h16 v26 h14 V98 h22 V112 h12 V90 h18 v60 Z"
    />
  )
}
function Mountains({ color }) {
  return (
    <>
      <path fill={color} opacity={0.6} d="M0 150 L50 92 L88 128 L130 78 L180 130 L220 98 L262 150 Z" />
      <path fill={color} d="M0 150 L38 112 L70 136 L118 96 L160 140 L210 110 L262 150 Z" />
    </>
  )
}
function Beach({ color }) {
  return (
    <>
      <path fill={color} d="M0 150 V128 Q70 112 140 126 T262 122 V150 Z" />
      <path d="M196 128 q2 -30 -6 -50" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path fill={color} d="M190 78 q-20 -4 -30 8 q16 -2 30 -8 Z M190 78 q18 -8 30 2 q-16 0 -30 -2 Z M190 78 q-8 -16 -24 -18 q10 10 24 18 Z M190 78 q6 -18 22 -20 q-10 12 -22 20 Z" />
    </>
  )
}

export default function DestinationArt({ seed, label, className }) {
  const id = useId()
  const h = hash(seed)
  const p = PALETTES[h % PALETTES.length]
  const Scene = [Skyline, Mountains, Beach][Math.floor(h / 7) % 3]
  return (
    <div className={cn('relative overflow-hidden', className)} aria-hidden="true">
      <svg viewBox="0 0 262 150" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.sky[0]} />
            <stop offset="1" stopColor={p.sky[1]} />
          </linearGradient>
        </defs>
        <rect width="262" height="150" fill={`url(#sky${id})`} />
        <circle cx={60 + (h % 140)} cy={44} r={18} fill={p.sun} opacity={0.9} />
        {/* plane + dashed route */}
        <path d={`M14 ${60 + (h % 20)} q80 -46 170 -18`} stroke="#fff" strokeWidth={2} strokeDasharray="4 6" fill="none" opacity={0.75} />
        <path transform={`translate(184 ${40 + (h % 12)}) rotate(14)`} fill="#fff" d="M0 0 l16 4 l8 -6 l3 1 l-4 8 l10 3 l-1 3 l-11 -1 l-6 7 l-3 -1 l3 -8 l-15 -4 Z" />
        <Scene color={p.ground} />
      </svg>
      {label && (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 font-display text-sm font-semibold text-navy shadow-sm">{label}</span>
      )}
    </div>
  )
}
