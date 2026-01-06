'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
}

const COLORS = ['#238636', '#58a6ff', '#a371f7', '#3fb950', '#f778ba']

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | null>(null)
  const isVisibleRef = useRef(true)

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !isVisibleRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const particles = particlesRef.current
    const mouse = mouseRef.current

    // Update and draw particles
    particles.forEach((particle, i) => {
      // Mouse attraction
      const dx = mouse.x - particle.x
      const dy = mouse.y - particle.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 200 && dist > 0) {
        const force = (200 - dist) / 200
        particle.vx += (dx / dist) * force * 0.02
        particle.vy += (dy / dist) * force * 0.02
      }

      // Apply velocity with damping
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vx *= 0.99
      particle.vy *= 0.99

      // Bounce off edges
      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

      // Keep in bounds
      particle.x = Math.max(0, Math.min(canvas.width, particle.x))
      particle.y = Math.max(0, Math.min(canvas.height, particle.y))

      // Draw particle
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.globalAlpha = particle.opacity
      ctx.fill()

      // Draw connections (only check particles after current one)
      for (let j = i + 1; j < particles.length; j++) {
        const other = particles[j]
        const connDx = particle.x - other.x
        const connDy = particle.y - other.y
        const connDist = Math.sqrt(connDx * connDx + connDy * connDy)

        if (connDist < 150) {
          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y)
          ctx.lineTo(other.x, other.y)
          ctx.strokeStyle = particle.color
          ctx.globalAlpha = (1 - connDist / 150) * 0.15
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    })

    ctx.globalAlpha = 1
    animationRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Reinitialize particles on resize with appropriate count
      const isMobile = window.innerWidth < 768
      const particleCount = Math.min(
        isMobile ? 30 : 80,
        Math.floor(window.innerWidth / 20)
      )
      
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Visibility API - pause animation when tab is hidden
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      
      if (document.hidden) {
        // Cancel animation when hidden
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      } else {
        // Resume animation when visible
        if (!animationRef.current) {
          animate()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start animation
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'transparent',
        willChange: 'transform',
      }}
    />
  )
}
