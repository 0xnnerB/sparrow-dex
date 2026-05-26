import { useMemo } from 'react'

const KEYFRAMES = `
@keyframes fly-a {
  0%   { transform: translate(0px,   0px);   opacity: 0.35; }
  20%  { transform: translate(55px, -80px);  opacity: 0.65; }
  45%  { transform: translate(-40px,-140px); opacity: 0.45; }
  70%  { transform: translate(75px, -190px); opacity: 0.70; }
  100% { transform: translate(0px,   0px);   opacity: 0.35; }
}
@keyframes fly-b {
  0%   { transform: translate(0px,   0px);  opacity: 0.50; }
  30%  { transform: translate(-80px, 75px); opacity: 0.35; }
  65%  { transform: translate(60px, 130px); opacity: 0.65; }
  100% { transform: translate(0px,   0px);  opacity: 0.50; }
}
@keyframes fly-c {
  0%   { transform: translate(0px,   0px);   opacity: 0.40; }
  25%  { transform: translate(100px,  45px); opacity: 0.70; }
  55%  { transform: translate(-40px, 110px); opacity: 0.35; }
  80%  { transform: translate(70px,  -50px); opacity: 0.60; }
  100% { transform: translate(0px,   0px);   opacity: 0.40; }
}
@keyframes fly-d {
  0%   { transform: translate(0px,    0px);  opacity: 0.60; }
  35%  { transform: translate(-110px,-70px); opacity: 0.35; }
  70%  { transform: translate(50px,   95px); opacity: 0.55; }
  100% { transform: translate(0px,    0px);  opacity: 0.60; }
}
`

const ANIMS = ['fly-a', 'fly-b', 'fly-c', 'fly-d']

const COLORS = [
  { bg: '#a855f7', glow: 'rgba(168, 85, 247, 0.65)' },
  { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.65)' },
  { bg: '#3b82f6', glow: 'rgba(59, 130, 246, 0.65)' },
  { bg: '#ec4899', glow: 'rgba(236, 72, 153, 0.65)' },
]

function rand(min, max) {
  return Math.random() * (max - min) + min
}

export default function Fireflies({ count = 18 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const color = COLORS[i % COLORS.length]
      const size = rand(10, 20)
      return {
        id: i,
        x: rand(2, 96),
        y: rand(2, 96),
        size,
        color,
        anim: ANIMS[i % ANIMS.length],
        duration: rand(16, 30),
        delay: rand(0, 16),
        opacity: rand(0.40, 0.70),
      }
    }),
  [count])

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 1,
        pointerEvents: 'none',
      }}>
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: p.color.bg,
              opacity: p.opacity,
              filter: 'blur(2px)',
              boxShadow: `0 0 ${p.size * 2}px ${p.size * 0.8}px ${p.color.glow}`,
              animation: `${p.anim} ${p.duration}s ${p.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}
