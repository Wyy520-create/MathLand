// 全屏彩带烟花：答对/过关时给孩子一点仪式感
export function confetti() {
  let cv = document.getElementById('confetti-cv')
  if (!cv) {
    cv = document.createElement('canvas')
    cv.id = 'confetti-cv'
    cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:80'
    document.body.appendChild(cv)
  }
  cv.width = innerWidth
  cv.height = innerHeight
  const g = cv.getContext('2d')
  const colors = ['#ff8a5c', '#4f8ef7', '#34c98e', '#ffc93c', '#b388ff', '#ff6b9d']
  const parts = Array.from({ length: 130 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 160,
    y: innerHeight * 0.36,
    vx: (Math.random() - 0.5) * 13,
    vy: -Math.random() * 13 - 4,
    s: 5 + Math.random() * 7,
    c: colors[(Math.random() * colors.length) | 0],
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    life: 90 + Math.random() * 40,
  }))
  let t = 0
  ;(function tick() {
    g.clearRect(0, 0, cv.width, cv.height)
    t++
    let alive = false
    for (const p of parts) {
      if (t > p.life) continue
      alive = true
      p.vy += 0.32
      p.x += p.vx
      p.y += p.vy
      p.r += p.vr
      g.save()
      g.translate(p.x, p.y)
      g.rotate(p.r)
      g.globalAlpha = Math.max(0, 1 - t / p.life)
      g.fillStyle = p.c
      g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62)
      g.restore()
    }
    if (alive) requestAnimationFrame(tick)
    else g.clearRect(0, 0, cv.width, cv.height)
  })()
}
