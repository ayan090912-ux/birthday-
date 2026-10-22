import React, { useEffect, useRef, useState } from 'react'
import { audioEngine } from '../utils/audioEngine'

export interface LanternConfig {
  id: string
  xPercent: number
  yPercent: number
  cordLength: number // length in px of top cord
  scale: number
  swingSpeed: number
  swingPhase: number
  color: string
  glowColor: string
  label?: string
}

interface InteractiveLanternProps {
  config: LanternConfig
  mouseX: number // normalized -1 to 1
  mouseY: number
  mouseVx: number
  rawMouseX: number
  rawMouseY: number
}

export const InteractiveLantern: React.FC<InteractiveLanternProps> = ({
  config,
  mouseX,
  mouseY,
  mouseVx,
  rawMouseX,
  rawMouseY
}) => {
  const lanternRef = useRef<HTMLDivElement | null>(null)
  const [angle, setAngle] = useState<number>(0)
  const [glowBonus, setGlowBonus] = useState<number>(0)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [pulses, setPulses] = useState<{ id: number; key: number }[]>([])

  const physicsRef = useRef({
    angle: 0,
    velocity: 0,
    damping: 0.982,
    springK: 0.045,
    glow: 0,
    time: config.swingPhase
  })

  // Pendulum swing & mouse interaction loop
  useEffect(() => {
    let animId: number

    const updatePhysics = () => {
      const p = physicsRef.current
      p.time += 0.024 * config.swingSpeed

      // 1. Natural ambient pendulum oscillation
      const ambientSwing = Math.sin(p.time) * (1.8 * config.scale)

      // 2. Mouse proximity wind impulse
      if (lanternRef.current) {
        const rect = lanternRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dist = Math.hypot(rawMouseX - centerX, rawMouseY - centerY)

        // If cursor moves near the lantern (within 130px)
        if (dist < 130 && Math.abs(mouseVx) > 0.5) {
          const force = (1 - dist / 130) * mouseVx * 0.08
          p.velocity += force
        }

        // Proximity glow
        if (dist < 160) {
          p.glow = Math.max(p.glow, (1 - dist / 160) * 0.45)
        }
      }

      // Spring physics toward ambient swing
      const restoringForce = (ambientSwing - p.angle) * p.springK
      p.velocity += restoringForce
      p.velocity *= p.damping
      p.angle += p.velocity

      // Decay glow bonus
      p.glow *= 0.96

      setAngle(p.angle)
      setGlowBonus(p.glow)

      animId = requestAnimationFrame(updatePhysics)
    }

    animId = requestAnimationFrame(updatePhysics)
    return () => cancelAnimationFrame(animId)
  }, [config.swingSpeed, config.scale, mouseVx, rawMouseX, rawMouseY])

  // Click / Tap pulse interaction
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Add radiant light pulse ring
    const newPulseId = Date.now()
    setPulses(prev => [...prev.slice(-3), { id: newPulseId, key: newPulseId }])

    // Impart strong impulse swing and bright glow flare
    physicsRef.current.velocity += (Math.random() - 0.5) * 4.5
    physicsRef.current.glow = 1.0

    // Play soft Japanese bell chime harmonic
    try {
      audioEngine.seek(audioEngine.currentTime) // activates audio context if sleeping
    } catch {}

    // Auto-clean pulse after animation finishes
    setTimeout(() => {
      setPulses(prev => prev.filter(p => p.id !== newPulseId))
    }, 1200)
  }

  // Parallax offset (lanterns have noticeable depth movement ~12px)
  const parallaxX = mouseX * 12
  const parallaxY = mouseY * 8

  // Organic micro-flicker calculation
  const flicker = Math.sin(physicsRef.current.time * 3.7) * 0.08 + Math.cos(physicsRef.current.time * 7.1) * 0.04
  const totalGlow = Math.min(1.5, 0.65 + flicker + glowBonus + (isHovered ? 0.35 : 0))

  return (
    <div
      ref={lanternRef}
      className={`interactive-hanging-lantern-root ${isHovered ? 'is-hovered' : ''}`}
      style={{
        left: `calc(${config.xPercent}% + ${parallaxX}px)`,
        top: `calc(${config.yPercent}% + ${parallaxY}px)`,
        transform: `translate(-50%, 0) scale(${config.scale})`,
        zIndex: 15
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Japanese Paper Lantern (Click to light)"
      role="button"
      tabIndex={0}
      aria-label="Interactive Japanese lantern"
    >
      {/* Expanding Radiant Light Pulse Rings */}
      {pulses.map(p => (
        <span
          key={p.key}
          className="lantern-light-pulse-ring"
          style={{ borderColor: config.glowColor }}
          aria-hidden="true"
        />
      ))}

      {/* Volumetric Radial Glow Aura */}
      <div
        className="lantern-volumetric-glow"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, rgba(255, 184, 89, ${totalGlow * 0.4}) 40%, transparent 75%)`,
          opacity: totalGlow,
          transform: `scale(${1 + totalGlow * 0.25})`
        }}
        aria-hidden="true"
      />

      {/* Hanging Cord & Pendulum Lantern Body */}
      <div
        className="lantern-pendulum-assembly"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: '50% 0px'
        }}
      >
        {/* Top Cord */}
        <div
          className="lantern-cord-line"
          style={{ height: `${config.cordLength}px` }}
        />

        {/* Top Wooden Cap with Brass Loop */}
        <div className="lantern-top-cap">
          <span className="lantern-hanger-loop" />
          <span className="lantern-roof-trim" />
        </div>

        {/* Ribbed Washi Paper Lantern Body with Sakura Crest */}
        <div
          className="lantern-paper-body"
          style={{
            boxShadow: `0 0 ${20 * totalGlow}px ${config.glowColor}, inset 0 0 15px rgba(255, 230, 180, ${totalGlow * 0.8})`
          }}
        >
          {/* Internal Incandescent Core Filament */}
          <div
            className="lantern-light-core"
            style={{
              opacity: Math.min(1, 0.7 + flicker + totalGlow * 0.3)
            }}
          />

          {/* Traditional Painted Sakura Crest */}
          <svg
            className="lantern-crest-emblem"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <path d="M12 3C12.5 6 14 7 16.5 7C14.5 8.5 14 10.5 15 13C12.5 12 11 12 9 13C10 10.5 9.5 8.5 7.5 7C10 7 11.5 6 12 3Z" />
            <circle cx="12" cy="8" r="1.3" fill="#FFE2C4" />
          </svg>

          {/* Rib Lines for Authentic Japanese Chochin */}
          <span className="lantern-rib rib-1" />
          <span className="lantern-rib rib-2" />
          <span className="lantern-rib rib-3" />
        </div>

        {/* Bottom Wooden Cap */}
        <div className="lantern-bottom-cap">
          <span className="lantern-base-trim" />
        </div>

        {/* Silk Tassel that swings with inertia */}
        <div
          className="lantern-silk-tassel"
          style={{
            transform: `rotate(${-angle * 0.4}deg)`,
            transformOrigin: '50% 0px'
          }}
        >
          <span className="tassel-knot" />
          <span className="tassel-fringe" />
        </div>
      </div>
    </div>
  )
}
