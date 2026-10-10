// 时间岛：认识钟表。两种题型交替——看钟读时间（选择）、听指令拨指针（拖动判定）
import { el, askChoice } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0)
const fmt = (h, m) => m === 0 ? `${h} 时` : m === 30 ? `${h} 时 30 分` : `${h} 时 ${String(m).padStart(2, '0')} 分`

// 生成目标时间（按难度）
function genTime(level) {
  const h = ri(1, 12)
  let m
  if (level <= 1) m = 0
  else if (level === 2) m = Math.random() < .7 ? 0 : 30
  else if (level <= 4) m = ri(0, 11) * 5
  else m = ri(0, 59)
  return { h, m }
}

// ---------- SVG 钟表 ----------
function makeClock({ interactive = false, size = 300 } = {}) {
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 300 300')
  svg.style.width = `${size}px`
  svg.style.maxWidth = '82vw'
  svg.style.touchAction = 'none'

  const bg = document.createElementNS(NS, 'circle')
  bg.setAttribute('cx', 150); bg.setAttribute('cy', 150); bg.setAttribute('r', 142)
  bg.setAttribute('fill', '#fff'); bg.setAttribute('stroke', '#dbe8fa'); bg.setAttribute('stroke-width', 8)
  svg.appendChild(bg)

  // 刻度 + 数字
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2
    const big = i % 5 === 0
    const r1 = big ? 124 : 132, r2 = 138
    const t = document.createElementNS(NS, 'line')
    t.setAttribute('x1', 150 + r1 * Math.cos(a)); t.setAttribute('y1', 150 + r1 * Math.sin(a))
    t.setAttribute('x2', 150 + r2 * Math.cos(a)); t.setAttribute('y2', 150 + r2 * Math.sin(a))
    t.setAttribute('stroke', big ? '#6b7a99' : '#c9d8ec')
    t.setAttribute('stroke-width', big ? 5 : 2)
    t.setAttribute('stroke-linecap', 'round')
    svg.appendChild(t)
    if (big) {
      const num = i === 0 ? 12 : i / 5
      const tx = document.createElementNS(NS, 'text')
      tx.setAttribute('x', 150 + 106 * Math.cos(a)); tx.setAttribute('y', 150 + 106 * Math.sin(a) + 7)
      tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-size', 26)
      tx.setAttribute('font-weight', 800); tx.setAttribute('fill', '#2b3a55')
      tx.textContent = num
      svg.appendChild(tx)
    }
  }

  const mkHand = (len, w, color) => {
    const l = document.createElementNS(NS, 'line')
    l.setAttribute('x1', 150); l.setAttribute('y1', 150)
    l.setAttribute('stroke', color); l.setAttribute('stroke-width', w)
    l.setAttribute('stroke-linecap', 'round')
    svg.appendChild(l)
    return l
  }
  const hourHand = mkHand(60, 11, '#2b3a55')
  const minHand = mkHand(92, 7, '#4f8ef7')
  const cap = document.createElementNS(NS, 'circle')
  cap.setAttribute('cx', 150); cap.setAttribute('cy', 150); cap.setAttribute('r', 9)
  cap.setAttribute('fill', '#ff8a5c')
  svg.appendChild(cap)

  const state = { h: 3, m: 0 }
  function paint() {
    const ha = ((state.h % 12) / 12 + state.m / 60 / 12) * Math.PI * 2 - Math.PI / 2
    const ma = (state.m / 60) * Math.PI * 2 - Math.PI / 2
    hourHand.setAttribute('x2', 150 + 62 * Math.cos(ha))
    hourHand.setAttribute('y2', 150 + 62 * Math.sin(ha))
    minHand.setAttribute('x2', 150 + 96 * Math.cos(ma))
    minHand.setAttribute('y2', 150 + 96 * Math.sin(ma))
  }
  paint()

  // 拖动：分针吸附到 1 分钟，时针吸附到整小时；拖分针时时针真实联动
  if (interactive) {
    let dragging = null
    const pt = e => {
      const r = svg.getBoundingClientRect()
      const p = e.touches ? e.touches[0] : e
      return [(p.clientX - r.left) * 300 / r.width - 150, (p.clientY - r.top) * 300 / r.height - 150]
    }
    const handEnd = hand => [Number(hand.getAttribute('x2')) - 150, Number(hand.getAttribute('y2')) - 150]
    const down = e => {
      const [x, y] = pt(e)
      if (Math.hypot(x, y) > 140) return
      const dh = Math.hypot(x - handEnd(hourHand)[0], y - handEnd(hourHand)[1])
      const dm = Math.hypot(x - handEnd(minHand)[0], y - handEnd(minHand)[1])
      dragging = dh < dm ? 'h' : 'm'
      e.preventDefault()
      sfx.pop()
    }
    const move = e => {
      if (!dragging) return
      const [x, y] = pt(e)
      let a = Math.atan2(y, x) + Math.PI / 2
      if (a < 0) a += Math.PI * 2
      if (dragging === 'm') {
        state.m = Math.round(a / (Math.PI * 2) * 60) % 60
        // 跨 12 点联动小时
        if (state.m === 0 && a > Math.PI) state.h = state.h % 12 + 1
        else if (state.m === 0 && a < Math.PI) state.h = ((state.h - 2 + 12) % 12) + 1
      } else {
        state.h = Math.round(a / (Math.PI * 2) * 12) % 12 || 12
      }
      paint()
      e.preventDefault()
    }
    const up = () => { dragging = null }
    svg.addEventListener('mousedown', down); svg.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    svg.addEventListener('touchstart', down, { passive: false })
    svg.addEventListener('touchmove', move, { passive: false })
    svg.addEventListener('touchend', up)
  }

  return {
    el: svg, state,
    set(h, m) { state.h = h; state.m = m; paint() },
    get: () => ({ ...state }),
  }
}

export default {
  id: 'clock',
  icon: '🕐',
  name: '时间岛',
  color: '#8e6ee8',
  grades: '1-3 年级',
  blurb: '拨一拨指针，认识整点、半点和几分',
  levelCount: 8,
  hintFor(level) {
    if (level <= 2) return '短短的针是<b>时针</b>，指着几就是几时；长长的针是<b>分针</b>，指着 12 就是整点，指着 6 就是 30 分（半点）。'
    return '分针走一大格是 5 分钟：指着 1 是 5 分，指着 3 是 15 分，指着 7 是 35 分……先读时针刚走过几，再读分针指着几乘 5。拨指针时拖长长的蓝针，短针会自己跟过来。'
  },
  async play(ctx, level) {
    const target = genTime(level)
    const readMode = Math.random() < .5

    if (readMode) {
      ctx.setPrompt(`钟面上是<em>几点</em>？`)
      const area = el('div', 'play-area')
      ctx.stage.appendChild(area)
      const clock = makeClock()
      clock.set(target.h, target.m)
      area.appendChild(clock.el)

      const options = new Set([fmt(target.h, target.m)])
      const near = [
        fmt(target.h % 12 + 1, target.m),
        fmt(target.h, (target.m + 5) % 60),
        fmt(target.h === 1 ? 12 : target.h - 1, target.m),
        fmt(target.h, (target.m + 60 - 5) % 60),
      ]
      for (const n of near) {
        if (options.size >= 4) break
        if (n.includes('60 分') || n.includes('undefined')) continue
        options.add(n)
      }
      // 补选项防止不足
      while (options.size < 4) options.add(fmt(ri(1, 12), ri(0, 11) * 5))
      const list = [...options]
      const ok = await askChoice(area, list, list.indexOf(fmt(target.h, target.m)))
      ctx.report(ok)
    } else {
      ctx.setPrompt(`请把指针拨到 <em>${fmt(target.h, target.m)}</em>`)
      const area = el('div', 'play-area')
      ctx.stage.appendChild(area)
      const clock = makeClock({ interactive: true })
      clock.set(ri(1, 12), 0)
      area.appendChild(clock.el)
      const tip = el('div', '', '👆 按住指针拖动（蓝的是分针，黑的是时针）')
      tip.style.color = '#6b7a99'
      area.appendChild(tip)

      const btn = el('button', 'btn green', '我拨好了 ✓')
      btn.onclick = () => {
        const { h, m } = clock.get()
        if (h === target.h && m === target.m) {
          ctx.report(true)
        } else {
          const msg = m === target.m
            ? `时针不对哦，现在是 ${h} 时 ${String(m).padStart(2, '0')} 分`
            : `分针不对哦，现在是 ${h} 时 ${String(m).padStart(2, '0')} 分`
          ctx.report(false)
          ctx.info(msg)
        }
      }
      area.appendChild(btn)
    }
  },
}
