import { useMemo } from 'react'

const KEYFRAMES = `
@keyframes fly-a {
  0%   { transform: translate(0px,   0px);   opacity: 0.15; }
  20%  { transform: translate(55px, -80px);  opacity: 0.25; }
  45%  { transform: translate(-40px,-140px); opacity: 0.18; }
  70%  { transform: translate(75px, -190px); opacity: 0.22; }
  100% { transform: translate(0px,   0px);   opacity: 0.15; }
}
@keyframes fly-b {
  0%   { transform: translate(0px,   0px);  opacity: 0.20; }
  30%  { transform: translate(-80px, 75px); opacity: 0.15; }
  65%  { transform: translate(60px, 130px); opacity: 0.25; }
  100% { transform: translate(0px,   0px);  opacity: 0.20; }
}
@keyframes fly-c {
  0%   { transform: translate(0px,   0px);   opacity: 0.18; }
  25%  { transform: translate(100px,  45px); opacity: 0.25; }
  55%  { transform: translate(-40px, 110px); opacity: 0.15; }
  80%  { transform: translate(70px,  -50px); opacity: 0.22; }
  100% { transform: translate(0px,   0px);   opacity: 0.18; }
}
@keyframes fly-d {
  0%   { transform: translate(0px,    0px);  opacity: 0.22; }
  35%  { transform: translate(-110px,-70px); opacity: 0.15; }
  70%  { transform: translate(50px,   95px); opacity: 0.20; }
  100% { transform: translate(0px,    0px);  opacity: 0.22; }
}
`

const ANIMS = ['fly-a', 'fly-b', 'fly-c', 'fly-d']

const COLORS = [
  { bg: '#ffffff', glow: 'rgba(255, 255, 255, 0.40)' },
  { bg: '#f5f0e8', glow: 'rgba(245, 240, 232, 0.35)' },
  { bg: '#ede8dd', glow: 'rgba(237, 232, 221, 0.30)' },
]

function rand(min, max) {
  return Math.random() * (max - min) + min
}

export default function Fireflies({ count = 7 }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const color = COLORS[i % COLORS.length]
      const size = rand(6, 10)
      return {
        id: i,
        x: rand(2, 96),
        y: rand(2, 96),
        size,
        color,
        anim: ANIMS[i % ANIMS.length],
        duration: rand(16, 30),
        delay: rand(0, 16),
        opacity: rand(0.15, 0.25),
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
              filter: 'blur(1px)',
              boxShadow: `0 0 ${p.size * 2}px ${p.size * 0.6}px ${p.color.glow}`,
              animation: `${p.anim} ${p.duration}s ${p.delay}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </>
  )
}
