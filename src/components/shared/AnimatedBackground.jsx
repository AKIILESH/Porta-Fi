import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId
    let t = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // ── SVG paths extracted from Lucide icons ──────────────────────────────
    // TrendingUp, BarChart2, Activity, DollarSign, PieChart, ArrowUpRight
    const ICON_PATHS = [
      // TrendingUp
      'M23 6 L13 16 L9 12 L1 20 M17 6 L23 6 L23 12',
      // BarChart2
      'M18 20 L18 10 M12 20 L12 4 M6 20 L6 14',
      // Activity
      'M22 12 L18 12 L15 20 L9 4 L6 12 L2 12',
      // ArrowUpRight
      'M7 17 L17 7 M7 7 L17 7 L17 17',
      // PieChart
      'M21.21 15.89 A10 10 0 1 1 8 2.83 M22 12 A10 10 0 0 0 12 2 L12 12 Z',
      // Percent
      'M19 5 L5 19 M6.5 3.5 A3 3 0 1 0 6.5 9.5 A3 3 0 0 0 6.5 3.5 M17.5 14.5 A3 3 0 1 0 17.5 20.5 A3 3 0 0 0 17.5 14.5',
      // Wallet
      'M20 12 L20 8 A2 2 0 0 0 18 6 L4 6 A2 2 0 0 0 2 8 L2 18 A2 2 0 0 0 4 20 L18 20 A2 2 0 0 0 20 18 L20 16 M16 12 A2 2 0 0 0 16 16 L22 16 L22 12 Z',
      // LineChart
      'M3 3 L3 21 L21 21 M7 16 L11 12 L15 14 L19 8',
    ]

    // ── Floating icon nodes ────────────────────────────────────────────────
    const nodes = Array.from({ length: 22 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      scale: 0.6 + Math.random() * 1.0,
      pathIndex: i % ICON_PATHS.length,
      opacity: 0.04 + Math.random() * 0.10,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.008,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.002,
      glowing: Math.random() > 0.7,
    }))

    // ── Connection lines between nearby nodes ──────────────────────────────
    const MAX_DIST = 200

    // ── Candlesticks ───────────────────────────────────────────────────────
    const candles = Array.from({ length: 14 }, (_, i) => ({
      x: 0.04 + i * 0.068,
      bodyH: 0.025 + Math.random() * 0.06,
      bodyY: 0.72 + (Math.random() - 0.5) * 0.1,
      wickTop: 0.008 + Math.random() * 0.025,
      wickBot: 0.008 + Math.random() * 0.025,
      bull: Math.random() > 0.45,
      phase: Math.random() * Math.PI * 2,
    }))

    // ── Scan line ──────────────────────────────────────────────────────────
    let scanY = 0

    const drawIconPath = (pathStr, cx, cy, scale, opacity, rotation, glowing) => {
      const size = 24
      const offset = (size / 2) * scale

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotation)
      ctx.scale(scale, scale)
      ctx.translate(-size / 2, -size / 2)

      if (glowing) {
        ctx.shadowColor = `rgba(0, 212, 255, ${opacity * 4})`
        ctx.shadowBlur = 12
      }

      ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`
      ctx.lineWidth = 1 / scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = 'none'

      // Parse and draw path segments
      const cmds = pathStr.match(/[MLAZQ]|[-\d.]+(?:\s[-\d.]+)*/g) || []
      ctx.beginPath()
      let i = 0
      while (i < cmds.length) {
        const cmd = cmds[i]
        if (cmd === 'M') {
          ctx.moveTo(parseFloat(cmds[i+1]), parseFloat(cmds[i+2])); i += 3
        } else if (cmd === 'L') {
          ctx.lineTo(parseFloat(cmds[i+1]), parseFloat(cmds[i+2])); i += 3
        } else if (cmd === 'Z') {
          ctx.closePath(); i++
        } else if (cmd === 'A') {
          // Arc: rx ry x-rot large-arc sweep x y
          const [rx, ry, xRot, large, sweep, ex, ey] = cmds.slice(i+1, i+8).map(Number)
          // Approximate arc via bezier for canvas
          ctx.arcTo(parseFloat(cmds[i+1]), parseFloat(cmds[i+2]),
                    parseFloat(cmds[i+6]), parseFloat(cmds[i+7]), parseFloat(cmds[i+1]))
          i += 8
        } else {
          i++
        }
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
    }

    const draw = () => {
      const { width: W, height: H } = canvas
      ctx.clearRect(0, 0, W, H)

      // Base
      ctx.fillStyle = '#060608'
      ctx.fillRect(0, 0, W, H)

      // ── Dot grid ──────────────────────────────────────────────────────────
      for (let x = 0; x < W; x += 44) {
        for (let y = 0; y < H; y += 44) {
          ctx.beginPath()
          ctx.arc(x, y, 0.7, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(0,212,255,0.06)'
          ctx.fill()
        }
      }

      // ── Connection lines ───────────────────────────────────────────────────
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.08
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // ── Icon nodes ────────────────────────────────────────────────────────
      nodes.forEach(n => {
        n.x += n.vx
        n.y += n.vy
        n.rotation += n.rotSpeed
        if (n.x < -60) n.x = W + 60
        if (n.x > W + 60) n.x = -60
        if (n.y < -60) n.y = H + 60
        if (n.y > H + 60) n.y = -60

        const pulse = 0.7 + Math.sin(t * n.pulseSpeed + n.pulsePhase) * 0.3
        drawIconPath(
          ICON_PATHS[n.pathIndex],
          n.x, n.y,
          n.scale,
          n.opacity * pulse,
          n.rotation,
          n.glowing
        )

        // Node dot
        ctx.beginPath()
        ctx.arc(n.x, n.y, 2 * n.scale * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,212,255,${n.opacity * pulse * 2})`
        ctx.fill()
      })

      // ── Candlesticks ──────────────────────────────────────────────────────
      candles.forEach(c => {
        const x = c.x * W
        const alpha = 0.10 + Math.sin(t * 0.008 + c.phase) * 0.04
        const bullColor = `rgba(0,229,160,${alpha})`
        const bearColor = `rgba(255,77,109,${alpha})`
        const color = c.bull ? bullColor : bearColor
        const bodyTop = (c.bodyY - c.bodyH / 2) * H
        const bodyBot = (c.bodyY + c.bodyH / 2) * H
        const cW = W * 0.016

        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, bodyTop - c.wickTop * H)
        ctx.lineTo(x, bodyBot + c.wickBot * H)
        ctx.stroke()

        ctx.fillStyle = color
        ctx.fillRect(x - cW / 2, bodyTop, cW, bodyBot - bodyTop)
      })

      // ── Portfolio wave ────────────────────────────────────────────────────
      ctx.beginPath()
      for (let i = 0; i <= 160; i++) {
        const px = (i / 160) * W
        const py = H * 0.42
          + Math.sin(i * 0.07 + t * 0.012) * H * 0.035
          + Math.sin(i * 0.03 + t * 0.006) * H * 0.055
          + Math.sin(i * 0.18 + t * 0.018) * H * 0.015
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.strokeStyle = 'rgba(0,212,255,0.12)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // ── Horizontal scan line ──────────────────────────────────────────────
      scanY = (scanY + 0.4) % H
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      scanGrad.addColorStop(0,   'rgba(0,212,255,0)')
      scanGrad.addColorStop(0.5, 'rgba(0,212,255,0.04)')
      scanGrad.addColorStop(1,   'rgba(0,212,255,0)')
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 40, W, 80)

      // ── Vignette ──────────────────────────────────────────────────────────
      const vig = ctx.createRadialGradient(W/2, H/2, H*0.05, W/2, H/2, H*0.95)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.82)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      t++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
    />
  )
}