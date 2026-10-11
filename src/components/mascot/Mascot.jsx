import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/ui'

/**
 * Orbi — ORBIT's travel-companion suitcase (hand-built SVG + Motion).
 * States: idle · welcome · thinking · reminder · success · ready
 * Motion follows UI/UX Pro Max: one animated focal element, loops only while idle/thinking,
 * and a static pose when the OS asks for reduced motion (MotionConfig reducedMotion="user").
 */
const NAVY = '#0B1D33'
const ORANGE_DARK = '#F2731F'
const MINT = '#2DD4BF'
const SKY = '#0EA5E9'
// Parts that must read on BOTH light and navy surfaces (navy would vanish on dark heroes)
const LIMB = '#E5641A'
const OUTLINE = '#D9581A'
const HARDWARE = '#64748B'

const STATE_LABEL = {
  idle: 'relaxed',
  welcome: 'waving hello',
  thinking: 'thinking',
  reminder: 'pointing at something you still need',
  success: 'celebrating',
  ready: 'wearing sunglasses and holding a boarding pass',
}

// Arm rotation (degrees) around the shoulder. 0 = hanging straight down.
const ARMS = {
  idle: { left: 18, right: -18 },
  welcome: { left: 18, right: [-150, -115, -150, -115, -150, -140] },
  thinking: { left: 18, right: -150 },
  reminder: { left: 18, right: -95 },
  success: { left: [150, 135, 150], right: [-150, -135, -150] },
  ready: { left: 75, right: -18 },
}

const BODY = {
  idle: { y: [0, -4, 0], transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } },
  welcome: { y: [0, -10, 0], transition: { duration: 0.6, ease: 'easeOut' } },
  thinking: { rotate: [-3, 3, -3], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  reminder: { rotate: 4, y: 0, transition: { type: 'spring', stiffness: 200, damping: 14 } },
  success: { y: [0, -18, 0], transition: { duration: 0.55, ease: 'easeOut' } },
  ready: { y: [0, -8, 0], transition: { duration: 0.7, ease: 'easeOut' } },
}

function Arm({ x, angle }) {
  const animated = Array.isArray(angle)
  return (
    <g transform={`translate(${x} 104)`}>
      <motion.g
        initial={false}
        animate={{ rotate: angle }}
        transition={animated ? { duration: 1.4, ease: 'easeInOut' } : { type: 'spring', stiffness: 180, damping: 14 }}
        style={{ originX: 0.5, originY: 0, transformBox: 'fill-box' }}
      >
        <rect x={-4.5} y={0} width={9} height={30} rx={4.5} fill={LIMB} />
        <circle cx={0} cy={32} r={7.5} fill="#FFB38A" stroke={LIMB} strokeWidth={3} />
      </motion.g>
    </g>
  )
}

function Eyes({ state, blink }) {
  if (state === 'success') {
    // Happy "^ ^" eyes
    return (
      <g stroke={NAVY} strokeWidth={5} strokeLinecap="round" fill="none">
        <path d="M72 94 Q82 82 92 94" />
        <path d="M108 94 Q118 82 128 94" />
      </g>
    )
  }
  const look = state === 'thinking' ? { x: -3, y: -4 } : state === 'reminder' ? { x: 4, y: 1 } : { x: 0, y: 0 }
  return (
    <motion.g animate={{ scaleY: blink ? 0.1 : 1 }} transition={{ duration: 0.08 }} style={{ originY: 0.5, transformBox: 'fill-box' }}>
      {[82, 118].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={92} rx={11} ry={12.5} fill="#fff" />
          <circle cx={cx + look.x} cy={93 + look.y} r={6} fill={NAVY} />
          <circle cx={cx + look.x + 2} cy={90 + look.y} r={1.8} fill="#fff" />
        </g>
      ))}
    </motion.g>
  )
}

function Mouth({ state }) {
  if (state === 'thinking') return <ellipse cx={104} cy={116} rx={4} ry={3.5} fill={NAVY} />
  if (state === 'reminder') return <path d="M93 116 Q100 112 107 116" stroke={NAVY} strokeWidth={4} strokeLinecap="round" fill="none" />
  if (state === 'success' || state === 'welcome') {
    return (
      <g>
        <path d="M88 110 Q100 128 112 110 Z" fill={NAVY} />
        <path d="M95 118 Q100 124 105 118 Z" fill="#FF6B6B" />
      </g>
    )
  }
  return <path d="M90 111 Q100 121 110 111" stroke={NAVY} strokeWidth={4} strokeLinecap="round" fill="none" />
}

function Sparkles({ big }) {
  const stars = big
    ? [
        [30, 40, 9],
        [170, 34, 11],
        [184, 96, 7],
        [16, 104, 8],
        [100, 6, 9],
      ]
    : [
        [36, 46, 7],
        [166, 40, 8],
        [176, 98, 6],
      ]
  return stars.map(([x, y, r], i) => (
    <motion.path
      key={i}
      d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`}
      fill={i % 2 ? MINT : '#FFC24B'}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
      transition={{ duration: 1.2, delay: i * 0.08 }}
      style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}
    />
  ))
}

export default function Mascot({ state = 'idle', message, size = 160, className, bubble = 'right', tone = 'light' }) {
  const [blink, setBlink] = useState(false)
  const reduce = useReducedMotion()

  // Occasional blink (skipped for reduced motion)
  useEffect(() => {
    if (reduce) return
    let timeout
    const loop = () => {
      timeout = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 140)
        loop()
      }, 3200 + Math.random() * 2600)
    }
    loop()
    return () => clearTimeout(timeout)
  }, [reduce])

  const arms = ARMS[state] ?? ARMS.idle

  return (
    <div className={cn('flex items-center gap-3', bubble === 'top' && 'flex-col-reverse', bubble === 'left' && 'flex-row-reverse', className)}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label={`Orbi the travel suitcase, ${STATE_LABEL[state] ?? 'relaxed'}`}
        className="shrink-0 overflow-visible"
      >
        <defs>
          <linearGradient id="orbi-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFA26E" />
            <stop offset="1" stopColor={ORANGE_DARK} />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <motion.ellipse
          cx={100}
          cy={186}
          rx={46}
          ry={6}
          fill={NAVY}
          opacity={0.14}
          animate={state === 'idle' ? { rx: [46, 42, 46] } : { rx: 46 }}
          transition={state === 'idle' ? { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />

        <AnimatePresence>
          {state === 'thinking' && (
            <motion.g key="bubble" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ transformBox: 'fill-box', originX: 0, originY: 1 }}>
              <circle cx={150} cy={52} r={5} fill="#fff" stroke={NAVY} strokeWidth={2.5} />
              <circle cx={162} cy={38} r={7} fill="#fff" stroke={NAVY} strokeWidth={2.5} />
              <rect x={152} y={4} width={44} height={26} rx={13} fill="#fff" stroke={NAVY} strokeWidth={2.5} />
              {[164, 174, 184].map((cx, i) => (
                <motion.circle
                  key={cx}
                  cx={cx}
                  cy={17}
                  r={3}
                  fill={SKY}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.g>
          )}
        </AnimatePresence>

        <motion.g key={state} initial={false} animate={BODY[state] ?? BODY.idle} style={{ transformBox: 'fill-box', originX: 0.5, originY: 1 }}>
          {/* handle */}
          <path d="M80 48 V36 a10 10 0 0 1 10 -10 h20 a10 10 0 0 1 10 10 V48" stroke={HARDWARE} strokeWidth={7} fill="none" strokeLinecap="round" />
          {/* body */}
          <rect x={46} y={44} width={108} height={122} rx={28} fill="url(#orbi-body)" stroke={OUTLINE} strokeWidth={4} />
          {/* luggage strap + buckle */}
          <rect x={48} y={134} width={104} height={11} fill={MINT} />
          <rect x={92} y={130} width={16} height={19} rx={4} fill={NAVY} />
          {/* ORBIT sticker */}
          <g transform="translate(64 152) rotate(-12)">
            <rect x={-9} y={-6} width={22} height={13} rx={3} fill="#fff" stroke={NAVY} strokeWidth={2} />
            <ellipse cx={2} cy={0.5} rx={7} ry={3} fill="none" stroke={SKY} strokeWidth={1.6} transform="rotate(-20 2 0.5)" />
          </g>
          {/* arms, drawn over the body edge so they read clearly */}
          <Arm x={50} angle={arms.left} />
          <Arm x={150} angle={arms.right} />
          {/* cheeks */}
          <ellipse cx={68} cy={110} rx={7} ry={4.5} fill="#FF6B6B" opacity={0.35} />
          <ellipse cx={132} cy={110} rx={7} ry={4.5} fill="#FF6B6B" opacity={0.35} />
          {/* eyebrows for reminder */}
          {state === 'reminder' && (
            <g stroke={NAVY} strokeWidth={3.5} strokeLinecap="round">
              <path d="M72 74 L90 72" />
              <path d="M110 72 L128 74" />
            </g>
          )}
          <Eyes state={state} blink={blink} />
          <Mouth state={state} />

          {/* sunglasses + boarding pass when the trip is ready */}
          {state === 'ready' && (
            <>
              <motion.g initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
                <path d="M66 86 h68" stroke={NAVY} strokeWidth={4} />
                <rect x={68} y={82} width={28} height={18} rx={8} fill={NAVY} />
                <rect x={104} y={82} width={28} height={18} rx={8} fill={NAVY} />
                <path d="M74 86 l8 0" stroke="#7DD3FC" strokeWidth={2.5} strokeLinecap="round" />
                <path d="M110 86 l8 0" stroke="#7DD3FC" strokeWidth={2.5} strokeLinecap="round" />
              </motion.g>
              <g transform="translate(8 118) rotate(-14)">
                <motion.g initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                  <rect x={0} y={0} width={40} height={24} rx={4} fill="#fff" stroke={NAVY} strokeWidth={2.5} />
                  <rect x={0} y={0} width={12} height={24} rx={3} fill={SKY} />
                  <path d="M17 8 h17 M17 14 h12" stroke={NAVY} strokeWidth={2} strokeLinecap="round" />
                </motion.g>
              </g>
            </>
          )}

          {/* wheels */}
          <circle cx={72} cy={172} r={8} fill={HARDWARE} />
          <circle cx={128} cy={172} r={8} fill={HARDWARE} />
          <circle cx={72} cy={172} r={2.5} fill="#fff" />
          <circle cx={128} cy={172} r={2.5} fill="#fff" />
        </motion.g>

        {(state === 'success' || state === 'ready') && <Sparkles key={`${state}-sparkles`} />}
      </svg>

      {message && (
        <div
          aria-live="polite"
          className={cn(
            'relative max-w-64 rounded-2xl px-4 py-3 text-[15px] leading-snug font-semibold shadow-card',
            tone === 'dark' ? 'bg-white text-navy' : 'bg-white text-navy ring-1 ring-navy/8',
          )}
        >
          <AnimatePresence mode="wait">
            <motion.p key={message} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
              {message}
            </motion.p>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
