import React, { useEffect, useRef, useState, useCallback } from 'react'
import { InteractiveLantern, LanternConfig } from './InteractiveLantern'
import { ForegroundSakuraCanopy } from './ForegroundSakuraCanopy'

interface Petal {
  id: number
  x: number
  y: number
  size: number
  layer: 'bg' | 'mid' | 'fg'
  color: string
  alpha: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  flip: number
  flipSpeed: number
  swaySpeed: number
  swayOffset: number
  pushVx: number
  pushVy: number
  glowBonus: number
}

interface Firefly {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  pulseSpeed: number
  pulsePhase: number
}

interface WaterRipple {
  x: number
  y: number
  r: number
  maxR: number
  alpha: number
}

// 5 Key interactive hanging lantern locations mapped accurately to the scene
const LANTERNS: LanternConfig[] = [
  {
    id: 'lantern-gate-top-left',
    xPercent: 9.6,
    yPercent: 26.0,
    cordLength: 30,
    scale: 1.15,
    swingSpeed: 0.9,
    swingPhase: 0.2,
    color: '#FFB859',
    glowColor: 'rgba(255, 184, 89, 0.45)'
  },
  {
    id: 'lantern-pillar-mid-left',
    xPercent: 3.6,
    yPercent: 47.0,
    cordLength: 20,
    scale: 0.95,
    swingSpeed: 1.15,
    swingPhase: 1.4,
    color: '#FFAE4A',
    glowColor: 'rgba(255, 174, 74, 0.4)'
  },
  {
    id: 'lantern-stair-left',
    xPercent: 42.6,
    yPercent: 74.0,
    cordLength: 14,
    scale: 0.8,
    swingSpeed: 1.25,
    swingPhase: 2.1,
    color: '#FFC86E',
    glowColor: 'rgba(255, 200, 110, 0.35)'
  },
  {
    id: 'lantern-stair-right',
    xPercent: 57.5,
    yPercent: 74.0,
    cordLength: 14,
    scale: 0.8,
    swingSpeed: 1.05,
    swingPhase: 0.8,
    color: '#FFC86E',
    glowColor: 'rgba(255, 200, 110, 0.35)'
  },
  {
    id: 'lantern-stone-right',
    xPercent: 69.8,
    yPercent: 70.0,
    cordLength: 16,
    scale: 0.85,
    swingSpeed: 0.85,
    swingPhase: 3.1,
    color: '#FFA845',
    glowColor: 'rgba(255, 168, 69, 0.38)'
  }
]

export const LivingCherryBlossomWorld: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // React state for passing smoothed coordinates to DOM layers
  const [pointerState, setPointerState] = useState({
    mouseX: 0,
    mouseY: 0,
    mouseVx: 0,
    breezeX: 0,
    rawMouseX: -1000,
    rawMouseY: -1000
  })

  // Mutable animation ref for 60fps physics
  const mouseRef = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    lastX: -1000,
    lastY: -1000,
    vx: 0,
    vy: 0,
    breezeX: 0,
    breezeY: 0,
    rawX: -1000,
    rawY: -1000
  })

  const ripplesRef = useRef<WaterRipple[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      mouseRef.current.targetX = (e.clientX - centerX) / centerX
      mouseRef.current.targetY = (e.clientY - centerY) / centerY

      const curX = e.clientX
      const curY = e.clientY
      mouseRef.current.rawX = curX
      mouseRef.current.rawY = curY

      if (mouseRef.current.lastX !== -1000) {
        mouseRef.current.vx = curX - mouseRef.current.lastX
        mouseRef.current.vy = curY - mouseRef.current.lastY
        const speed = Math.hypot(mouseRef.current.vx, mouseRef.current.vy)
        if (speed > 6) {
          mouseRef.current.breezeX += mouseRef.current.vx * 0.05
          mouseRef.current.breezeY += mouseRef.current.vy * 0.03
        }
      }

      mouseRef.current.lastX = curX
      mouseRef.current.lastY = curY

      // Water ripples when pointer moves across the pond (lower third)
      if (curY > height * 0.65 && Math.random() < 0.28) {
        ripplesRef.current.push({
          x: curX,
          y: curY,
          r: 3,
          maxR: Math.random() * 26 + 16,
          alpha: 0.65
        })
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0
      mouseRef.current.targetY = 0
      mouseRef.current.rawX = -1000
      mouseRef.current.rawY = -1000
      mouseRef.current.lastX = -1000
      mouseRef.current.lastY = -1000
      mouseRef.current.vx = 0
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        mouseRef.current.targetX = (touch.clientX - centerX) / centerX
        mouseRef.current.targetY = (touch.clientY - centerY) / centerY
        mouseRef.current.rawX = touch.clientX
        mouseRef.current.rawY = touch.clientY

        if (mouseRef.current.lastX !== -1000) {
          mouseRef.current.breezeX += (touch.clientX - mouseRef.current.lastX) * 0.04
        }
        mouseRef.current.lastX = touch.clientX
        mouseRef.current.lastY = touch.clientY
      }
    }

    // Interactive Click Burst
    const handleClick = (e: MouseEvent) => {
      // Ignore if clicking interactive controls or lanterns directly
      if ((e.target as HTMLElement).closest('button, aside, .interactive-hanging-lantern-root')) {
        return
      }

      const clickX = e.clientX
      const clickY = e.clientY
      const count = 12

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25
        const speed = Math.random() * 3.5 + 2
        petals.push({
          id: Date.now() + Math.random(),
          x: clickX + Math.cos(angle) * 8,
          y: clickY + Math.sin(angle) * 8,
          size: Math.random() * 6 + 9,
          layer: 'mid',
          color: petalColors[Math.floor(Math.random() * petalColors.length)],
          alpha: 0.9,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.75,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.06,
          flip: Math.random() * Math.PI,
          flipSpeed: Math.random() * 0.04 + 0.02,
          swaySpeed: 0.02,
          swayOffset: Math.random() * Math.PI * 2,
          pushVx: 0,
          pushVy: 0,
          glowBonus: 0.4
        })
      }

      // Water ripple on pond click
      if (clickY > height * 0.6) {
        ripplesRef.current.push({
          x: clickX,
          y: clickY,
          r: 4,
          maxR: 42,
          alpha: 0.8
        })
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('click', handleClick)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.innerWidth < 768

    // 1. Multi-depth Sakura Petals initialization
    const petalColors = ['#F9CADB', '#FFDEEA', '#E896B8', '#FCE4ED', '#FFFFFF']
    const petals: Petal[] = []

    const bgCount = isMobile ? 8 : 16
    const midCount = isMobile ? 12 : 22
    const fgCount = isMobile ? 2 : 5

    // Background petals (small, deep, slow, soft blur)
    for (let i = 0; i < bgCount; i++) {
      petals.push({
        id: Math.random(),
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * (height + 200) - 100,
        size: Math.random() * 2 + 3.5,
        layer: 'bg',
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        alpha: Math.random() * 0.25 + 0.35,
        vx: prefersReducedMotion ? 0.1 : Math.random() * 0.2 + 0.18,
        vy: prefersReducedMotion ? 0.15 : Math.random() * 0.3 + 0.35,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.015 + 0.008,
        swaySpeed: 0.01,
        swayOffset: Math.random() * Math.PI * 2,
        pushVx: 0,
        pushVy: 0,
        glowBonus: 0
      })
    }

    // Midground petals (crisp, natural tumble around shrine)
    for (let i = 0; i < midCount; i++) {
      petals.push({
        id: Math.random(),
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * (height + 200) - 100,
        size: Math.random() * 4 + 7,
        layer: 'mid',
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        alpha: Math.random() * 0.25 + 0.6,
        vx: prefersReducedMotion ? 0.2 : Math.random() * 0.35 + 0.28,
        vy: prefersReducedMotion ? 0.25 : Math.random() * 0.45 + 0.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.018,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.02 + 0.015,
        swaySpeed: 0.016,
        swayOffset: Math.random() * Math.PI * 2,
        pushVx: 0,
        pushVy: 0,
        glowBonus: 0
      })
    }

    // Foreground petals (large, passing close with soft drop shadow)
    for (let i = 0; i < fgCount; i++) {
      petals.push({
        id: Math.random(),
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * (height + 200) - 100,
        size: Math.random() * 5 + 13,
        layer: 'fg',
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        alpha: Math.random() * 0.2 + 0.68,
        vx: prefersReducedMotion ? 0.3 : Math.random() * 0.45 + 0.4,
        vy: prefersReducedMotion ? 0.35 : Math.random() * 0.55 + 0.7,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.022,
        flip: Math.random() * Math.PI,
        flipSpeed: Math.random() * 0.025 + 0.018,
        swaySpeed: 0.02,
        swayOffset: Math.random() * Math.PI * 2,
        pushVx: 0,
        pushVy: 0,
        glowBonus: 0
      })
    }

    // 2. Golden Fireflies / Ambient Sparkles (hovering over water and near lanterns)
    const fireflies: Firefly[] = []
    const fireflyCount = isMobile ? 6 : 14
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: height * 0.52 + Math.random() * (height * 0.42),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 2 + 1.8,
        baseAlpha: Math.random() * 0.35 + 0.45,
        pulseSpeed: Math.random() * 0.03 + 0.02,
        pulsePhase: Math.random() * Math.PI * 2
      })
    }

    // Helper to draw realistic sakura petal shape with cleft notch
    const drawPetalShape = (x: number, y: number, size: number, rotation: number, flip: number, color: string, alpha: number, layer: string, glow: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)
      const scaleY = Math.cos(flip)
      ctx.scale(1, Math.max(0.12, Math.abs(scaleY)))

      const w = size * 0.6
      const h = size
      ctx.beginPath()
      ctx.moveTo(0, -h * 0.5)
      ctx.bezierCurveTo(w * 0.95, -h * 0.32, w * 1.1, h * 0.2, 0, h * 0.5)
      ctx.bezierCurveTo(-w * 1.1, h * 0.2, -w * 0.95, -h * 0.32, 0, -h * 0.5)
      ctx.closePath()

      // Gradient shading
      const grad = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5)
      grad.addColorStop(0, color)
      grad.addColorStop(0.65, color)
      grad.addColorStop(1, '#D98DAE')

      ctx.fillStyle = grad
      ctx.globalAlpha = Math.min(1, alpha + glow)

      if (layer === 'fg' || glow > 0) {
        ctx.shadowColor = '#F4B7CD'
        ctx.shadowBlur = layer === 'fg' ? 10 : 6
      } else {
        ctx.shadowBlur = 0
      }

      ctx.fill()
      ctx.restore()
    }

    let time = 0
    let frameCounter = 0

    const render = () => {
      time += 0.02
      frameCounter++

      // Smooth mouse lerping
      const m = mouseRef.current
      m.currentX += (m.targetX - m.currentX) * 0.05
      m.currentY += (m.targetY - m.currentY) * 0.05
      m.breezeX *= 0.94
      m.breezeY *= 0.94

      // Throttle React state updates to every 3 frames (~20fps) for smooth DOM parallax without re-render overhead
      if (frameCounter % 3 === 0) {
        setPointerState({
          mouseX: m.currentX,
          mouseY: m.currentY,
          mouseVx: m.vx,
          breezeX: m.breezeX,
          rawMouseX: m.rawX,
          rawMouseY: m.rawY
        })
      }

      ctx.clearRect(0, 0, width, height)

      // 1. Water Surface Ripple Highlights
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rip = ripplesRef.current[i]
        rip.r += 0.45
        rip.alpha -= 0.014

        ctx.save()
        ctx.beginPath()
        ctx.ellipse(rip.x, rip.y, rip.r * 2.0, rip.r * 0.45, 0, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 215, 175, ' + Math.max(0, rip.alpha) + ')'
        ctx.lineWidth = 1.2
        ctx.stroke()
        ctx.restore()

        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          ripplesRef.current.splice(i, 1)
        }
      }

      // 2. Golden Fireflies / Ambient Light Motes
      for (const f of fireflies) {
        f.pulsePhase += f.pulseSpeed
        f.x += f.vx + Math.sin(f.pulsePhase) * 0.3
        f.y += f.vy + Math.cos(f.pulsePhase * 0.8) * 0.2

        // Wrap around water area
        if (f.x < 0) f.x = width
        if (f.x > width) f.x = 0
        if (f.y < height * 0.48) f.y = height * 0.94
        if (f.y > height * 0.96) f.y = height * 0.52

        const pulseAlpha = Math.max(0.1, f.baseAlpha + Math.sin(f.pulsePhase) * 0.3)
        const rad = f.size * 2.8

        const fireflyGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad)
        fireflyGrad.addColorStop(0, 'rgba(255, 240, 190, ' + pulseAlpha + ')')
        fireflyGrad.addColorStop(0.4, 'rgba(255, 185, 90, ' + (pulseAlpha * 0.4) + ')')
        fireflyGrad.addColorStop(1, 'rgba(255, 185, 90, 0)')

        ctx.save()
        ctx.beginPath()
        ctx.arc(f.x, f.y, rad, 0, Math.PI * 2)
        ctx.fillStyle = fireflyGrad
        ctx.fill()
        ctx.restore()
      }

      // 3. Falling Sakura Petal Physics
      const moonX = width * 0.765 + m.currentX * 6
      const moonY = height * 0.165 + m.currentY * 4
      const moonRadius = width * 0.18

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i]
        p.rotation += p.rotationSpeed
        p.flip += p.flipSpeed

        const sway = Math.sin(time * p.swaySpeed * 60 + p.swayOffset) * 0.75

        // Mouse proximity repulsion physics
        const dx = p.x - m.rawX
        const dy = p.y - m.rawY
        const dist = Math.hypot(dx, dy)
        const repelRadius = 140

        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * 2.2
          p.pushVx += (dx / dist) * force
          p.pushVy += (dy / dist) * force
          p.rotationSpeed += (Math.random() - 0.5) * 0.02
        }

        // Moonlit area luminescence bonus
        const distToMoon = Math.hypot(p.x - moonX, p.y - moonY)
        if (distToMoon < moonRadius) {
          p.glowBonus = (1 - distToMoon / moonRadius) * 0.35
        } else {
          p.glowBonus *= 0.95
        }

        // Layer parallax drift
        const layerParallax = p.layer === 'fg' ? 24 : p.layer === 'mid' ? 14 : 6
        const speedX = p.vx + sway + p.pushVx + m.breezeX + m.currentX * (layerParallax * 0.03)
        const speedY = p.vy + p.pushVy + m.breezeY + m.currentY * (layerParallax * 0.02)

        p.x += speedX
        p.y += speedY

        // Decay push velocities back to wind
        p.pushVx *= 0.92
        p.pushVy *= 0.92

        // Smooth viewport wrap
        if (p.y > height + 50) {
          p.y = -50
          p.x = Math.random() * (width + 100) - 50
        }
        if (p.x > width + 50) {
          p.x = -50
        } else if (p.x < -50) {
          p.x = width + 50
        }

        drawPetalShape(p.x, p.y, p.size, p.rotation, p.flip, p.color, p.alpha, p.layer, p.glowBonus)
      }

      animId = requestAnimationFrame(render)
    }

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId)
      } else {
        animId = requestAnimationFrame(render)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    animId = requestAnimationFrame(render)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('click', handleClick)
      cancelAnimationFrame(animId)
    }
  }, [])

  // Parallax offsets for distinct scenery layers
  const skyParallaxX = pointerState.mouseX * 6
  const skyParallaxY = pointerState.mouseY * 4
  const shrineParallaxX = pointerState.mouseX * 10
  const shrineParallaxY = pointerState.mouseY * 6

  return (
    <div ref={containerRef} className="living-shrine-world-container">
      <div
        className="scenery-base-layer"
        style={{
          transform: `translate3d(${shrineParallaxX}px, ${shrineParallaxY}px, 0) scale(1.015)`
        }}
      >
        <picture className="scenery-base-picture">
          {/* Mobile small viewports */}
          <source
            media="(max-width: 640px)"
            type="image/webp"
            srcSet="/shrine-mobile.webp"
          />
          {/* 4K UHD Ultra-High-Resolution Master for all desktop, laptop & Retina displays */}
          <source
            type="image/webp"
            srcSet="/shrine-4k.webp"
          />
          {/* Universal 4K Fallback Image */}
          <img
            src="/shrine-4k.jpg"
            alt="Japanese cherry blossom shrine at dusk with Mount Fuji and glowing moon"
            className="scenery-base-image"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>

      {/* Layer 2: Drifting Mountain Valley Mist & Twilight Clouds */}
      <div
        className="scenery-drifting-clouds-layer"
        style={{
          transform: `translate3d(${skyParallaxX}px, ${skyParallaxY}px, 0)`
        }}
      >
        <div className="cloud-band cloud-band-1" />
        <div className="cloud-band cloud-band-2" />
      </div>

      {/* Layer 3: Lunar Corona Breathing Glow */}
      <div
        className="lunar-corona-glow"
        style={{
          transform: `translate3d(${skyParallaxX * 0.8}px, ${skyParallaxY * 0.8}px, 0)`
        }}
        aria-hidden="true"
      />

      {/* Layer 4: Interactive Hanging Japanese Lanterns (DOM with Pendulum Physics & Click Pulse) */}
      <div className="lanterns-interactive-layer">
        {LANTERNS.map(config => (
          <InteractiveLantern
            key={config.id}
            config={config}
            mouseX={pointerState.mouseX}
            mouseY={pointerState.mouseY}
            mouseVx={pointerState.mouseVx}
            rawMouseX={pointerState.rawMouseX}
            rawMouseY={pointerState.rawMouseY}
          />
        ))}
      </div>

      {/* Layer 5: Interactive 60fps HTML5 Canvas (Water Ripples, Golden Fireflies & Falling Sakura Petals) */}
      <canvas
        ref={canvasRef}
        id="living-sakura-canvas"
        className="living-sakura-canvas"
      />

      {/* Layer 6: Foreground Swaying Sakura Branches Canopy (Pronounced 3D Depth) */}
      <ForegroundSakuraCanopy
        mouseX={pointerState.mouseX}
        mouseY={pointerState.mouseY}
        breezeX={pointerState.breezeX}
      />
    </div>
  )
}
