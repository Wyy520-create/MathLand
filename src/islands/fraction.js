// 分数岛：切披萨认识分数。看图选分数、按分数涂色、比大小（图形辅助）
import { el, askChoice, numPad } from '../core/ui.js'
import { sfx } from '../core/sound.js'

const ri = (a, b) => a + ((Math.random() * (b - a + 1)) | 0)

// ---------- 圆形分数图 ----------
function makePizza(denominator, colored = 0, { clickable = false, onPick } = {}) {
  const cv = document.createElement('canvas')
  const S = 240
  cv.width = cv.height = S
  cv.style.width = '210px'
  cv.style.maxWidth = '60vw'
  const g = cv.getContext('2d')
  const cx = S / 2, cy = S / 2, r = 100

  function paint(coloredSet) {
    g.clearRect(0, 0, S, S)
    for (let i = 0; i < denominator; i++) {
      const a0 = -Math.PI / 2 + (i / denominator) * Math.PI * 2
      const a1 = a0 + Math.PI * 2 / denominator
      g.beginPath()
      g.moveTo(cx, cy)
      g.arc(cx, cy, r, a0, a1)
      g.closePath()
      g.fillStyle = coloredSet.has(i) ? '#ffb26b' : '#fff4e0'
      g.fill()
      g.strokeStyle = '#e8b06a'
      g.lineWidth = 3
      g.stroke()
      if (coloredSet.has(i)) {
        g.save()
        g.clip()
        g.fillStyle = 'rgba(255,255,255,.3)'
        const am = (a0 + a1) / 2
        g.beginPath()
        g.arc(cx + r * .55 * Math.cos(am), cy + r * .55 * Math.sin(am), 7, 0, 7)
        g.fill()
        g.restore()
      }
    }
  }

  const coloredSet = new Set()
  for (let i = 0; i < colored; i++) coloredSet.add(i)
  paint(coloredSet)

  if (clickable) {
    cv.style.cursor = 'pointer'
    cv.addEventListener('click', e => {
      const rect = cv.getBoundingClientRect()
      const x = (e.clientX - rect.left) * S / rect.width - cx
      const y = (e.clientY - rect.top) * S / rect.height - cy
      if (Math.hypot(x, y) > r) return
      let a = Math.atan2(y, x) + Math.PI / 2
      if (a < 0) a += Math.PI * 2
      const i = Math.min(denominator - 1, (a / (Math.PI * 2) * denominator) | 0)
      if (coloredSet.has(i)) coloredSet.delete(i)
      else coloredSet.add(i)
      sfx.pop()
      paint(coloredSet)
      onPick && onPick(coloredSet.size)
    })
  }

  return { el: cv, count: () => coloredSet.size }
}

export default {
  id: 'fraction',
  icon: '🍕',
  name: '分数岛',
  color: '#ff6b9d',
  grades: '3-5 年级',
  blurb: '切披萨学分数：几分之几、涂一涂、比大小',
  levelCount: 8,
  hintFor(level) {
    if (level <= 2) return '分数下面是<b>分母</b>：披萨被平均分成了几份；上面是<b>分子</b>：涂色了几份。先数一共切成几份，再数涂了几份。'
    if (level <= 4) return '涂色时一份一份点，点够题目要的份数就好。分子是几就涂几份！'
    return '比大小有诀窍：<b>分母相同比分子</b>（切的份数一样，取得多就大）；<b>分子相同比分母</b>（取得一样多，切得越细每份越小，分母大的反而小）。拿不准就看图：涂色多的那个大。'
  },
  async play(ctx, level) {
    // 题型：L1-2 看图选分数；L3-4 按分数涂色；L5+ 比大小
    const kind = level <= 2 ? 'read' : level <= 4 ? 'paint' : 'compare'

    if (kind === 'read') {
      const d = ri(2, level === 1 ? 4 : 6)
      const n = ri(1, d - 1)
      ctx.setPrompt(`披萨被平均切成 <em>${d}</em> 份，涂色的是<em>几分之几</em>？`)
      const area = el('div', 'play-area')
      ctx.stage.appendChild(area)
      area.appendChild(makePizza(d, n).el)
      const correct = `${n}/${d}`
      const wrongs = new Set([`${n}/${d + 1}`, `${Math.max(1, n - 1)}/${d}`, `${Math.min(d - 1, n + 1)}/${d}`, `${d - n}/${d}`])
      wrongs.delete(correct)
      const list = [correct, ...[...wrongs].slice(0, 3)].sort(() => Math.random() - .5)
      const ok = await askChoice(area, list, list.indexOf(correct))
      ctx.report(ok)
      return
    }

    if (kind === 'paint') {
      const d = ri(3, 6)
      const n = ri(1, d - 1)
      ctx.setPrompt(`请把 <em>${n}/${d}</em> 涂上色：点披萨切块，涂满 ${n} 份后点「好了」`)
      const area = el('div', 'play-area')
      ctx.stage.appendChild(area)
      const info = el('div', '', `已涂 0 / ${n} 份`)
      info.style.fontWeight = '800'
      const pz = makePizza(d, 0, {
        clickable: true,
        onPick(c) { info.textContent = `已涂 ${c} / ${n} 份` },
      })
      area.append(pz.el, info)
      const btn = el('button', 'btn green', '好了 ✓')
      btn.onclick = () => {
        if (pz.count() === n) ctx.report(true)
        else {
          ctx.report(false)
          ctx.info(`涂了 ${pz.count()} 份，题目要 ${n} 份，再试试`)
        }
      }
      area.appendChild(btn)
      return
    }

    // 比大小
    let d1, d2, n1, n2
    if (level <= 6) { // 同分母
      d1 = d2 = ri(3, 8); n1 = ri(1, d1 - 1); n2 = ri(1, d2 - 1)
      if (n1 === n2) n2 = n2 % (d2 - 1) + 1
    } else { // 异分母
      d1 = pickDen(), d2 = pickDen()
      while (d2 === d1) d2 = pickDen()
      n1 = ri(1, d1 - 1); n2 = ri(1, d2 - 1)
      if (n1 / d1 === n2 / d2) n2 = n2 % (d2 - 1) + 1
    }
    function pickDen() { return [2, 3, 4, 5, 6][ri(0, 4)] }
    const ans = n1 / d1 > n2 / d2 ? '>' : '<'
    ctx.setPrompt(`比一比：<em>${n1}/${d1}</em> 和 <em>${n2}/${d2}</em>，哪边大？`)
    const area = el('div', 'play-area')
    ctx.stage.appendChild(area)
    const row = el('div', 'row')
    row.style.alignItems = 'center'
    const left = el('div', '', ''); left.appendChild(makePizza(d1, n1).el)
    const right = el('div', '', ''); right.appendChild(makePizza(d2, n2).el)
    row.append(left, right)
    area.appendChild(row)
    const ok = await askChoice(area, ['左边大 >', '一样大 =', '右边大 <'],
      ans === '>' ? 0 : ans === '=' ? 1 : 2)
    ctx.report(ok)
  },
}
